-- PostgreSQL 17+. Initial standalone prototype, not a Django migration.
-- Run once against a development database with ON_ERROR_STOP=1.
BEGIN;
CREATE SCHEMA credit_mvp;
SET LOCAL search_path = credit_mvp, public;

-- Domain identities only. Authentication is owned by Django Auth.
-- Add a OneToOneField to AUTH_USER_MODEL in the Django implementation.
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(254) NOT NULL,
    display_name varchar(255) NOT NULL CHECK (btrim(display_name) <> ''),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_ci_uq ON users (lower(email));

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL CHECK (btrim(name) <> ''),
    inn varchar(12) NOT NULL UNIQUE CHECK (inn ~ '^([0-9]{10}|[0-9]{12})$'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_members (
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role varchar(20) NOT NULL DEFAULT 'representative'
        CHECK (role IN ('owner', 'representative')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    PRIMARY KEY (organization_id, user_id),
    CHECK (revoked_at IS NULL OR revoked_at >= joined_at)
);
CREATE INDEX organization_members_user_idx ON organization_members (user_id);

CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number varchar(50) NOT NULL UNIQUE CHECK (btrim(number) <> ''),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    created_by uuid NOT NULL,
    product_code varchar(50) NOT NULL CHECK (btrim(product_code) <> ''),
    requested_amount numeric(18,2) NOT NULL CHECK (requested_amount > 0),
    currency varchar(3) NOT NULL DEFAULT 'RUB' CHECK (currency ~ '^[A-Z]{3}$'),
    term_months smallint NOT NULL CHECK (term_months BETWEEN 1 AND 600),
    status varchar(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'in_review', 'needs_info',
                          'approved', 'rejected', 'withdrawn')),
    submitted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (organization_id, created_by)
        REFERENCES organization_members(organization_id, user_id) ON DELETE RESTRICT,
    CHECK (submitted_at IS NULL OR submitted_at >= created_at)
);
CREATE INDEX applications_org_created_idx ON applications (organization_id, created_at DESC, id);
CREATE INDEX applications_status_updated_idx ON applications (status, updated_at DESC, id);

-- Membership is retained after revocation to keep historical references valid.
CREATE TABLE application_participants (
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role varchar(20) NOT NULL CHECK (role IN ('client', 'manager', 'analyst')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    PRIMARY KEY (application_id, user_id),
    CHECK (revoked_at IS NULL OR revoked_at >= joined_at)
);
CREATE UNIQUE INDEX application_one_manager_uq ON application_participants (application_id)
    WHERE role = 'manager' AND revoked_at IS NULL;
CREATE INDEX application_participants_user_idx ON application_participants (user_id, application_id);

CREATE TABLE bank_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    created_by uuid NOT NULL,
    title varchar(255) NOT NULL CHECK (btrim(title) <> ''),
    description text NOT NULL CHECK (btrim(description) <> ''),
    status varchar(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
    due_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_id, id),
    FOREIGN KEY (application_id, created_by)
        REFERENCES application_participants(application_id, user_id) ON DELETE RESTRICT
);
CREATE INDEX bank_requests_app_status_idx ON bank_requests (application_id, status, due_at, id);

-- A logical document/slot exists independently of any uploaded version.
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    bank_request_id uuid,
    title varchar(255) NOT NULL CHECK (btrim(title) <> ''),
    document_type varchar(64) NOT NULL CHECK (btrim(document_type) <> ''),
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_id, id),
    FOREIGN KEY (application_id, bank_request_id)
        REFERENCES bank_requests(application_id, id) ON DELETE RESTRICT
);
CREATE INDEX documents_request_idx ON documents (application_id, bank_request_id);

-- File bytes live in private storage. Only metadata is stored here.
CREATE TABLE document_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL CHECK (version_number > 0),
    uploaded_by uuid NOT NULL,
    storage_key varchar(512) NOT NULL UNIQUE CHECK (btrim(storage_key) <> ''),
    original_filename varchar(255) NOT NULL CHECK (btrim(original_filename) <> ''),
    content_type varchar(127) NOT NULL CHECK (btrim(content_type) <> ''),
    size_bytes bigint NOT NULL CHECK (size_bytes > 0),
    sha256 varchar(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    scan_status varchar(16) NOT NULL DEFAULT 'pending'
        CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
    scan_completed_at timestamptz,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (document_id, version_number),
    UNIQUE (application_id, id),
    FOREIGN KEY (application_id, document_id)
        REFERENCES documents(application_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, uploaded_by)
        REFERENCES application_participants(application_id, user_id) ON DELETE RESTRICT,
    CHECK ((scan_status = 'pending' AND scan_completed_at IS NULL)
        OR (scan_status IN ('clean', 'infected', 'error') AND scan_completed_at IS NOT NULL)),
    CHECK (scan_completed_at IS NULL OR scan_completed_at >= uploaded_at)
);
CREATE INDEX document_versions_scan_pending_idx ON document_versions (uploaded_at, id)
    WHERE scan_status IN ('pending', 'error');

-- One final staff decision per immutable version in the MVP.
CREATE TABLE document_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL,
    document_version_id uuid NOT NULL UNIQUE,
    reviewed_by uuid NOT NULL,
    decision varchar(20) NOT NULL CHECK (decision IN ('accepted', 'changes_requested')),
    comment text NOT NULL DEFAULT '',
    reviewed_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (application_id, document_version_id)
        REFERENCES document_versions(application_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, reviewed_by)
        REFERENCES application_participants(application_id, user_id) ON DELETE RESTRICT,
    CHECK (decision <> 'changes_requested' OR btrim(comment) <> '')
);
CREATE INDEX document_reviews_app_idx ON document_reviews (application_id, reviewed_at, id);

-- A message is in the application, in a request, or about a specific version.
CREATE TABLE messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    author_id uuid NOT NULL,
    bank_request_id uuid,
    document_version_id uuid,
    body text NOT NULL CHECK (btrim(body) <> ''),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_id, id),
    FOREIGN KEY (application_id, author_id)
        REFERENCES application_participants(application_id, user_id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, bank_request_id)
        REFERENCES bank_requests(application_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, document_version_id)
        REFERENCES document_versions(application_id, id) ON DELETE RESTRICT,
    CHECK (num_nonnulls(bank_request_id, document_version_id) <= 1)
);
CREATE INDEX messages_app_timeline_idx ON messages (application_id, created_at, id);
CREATE INDEX messages_request_idx ON messages (application_id, bank_request_id, created_at, id)
    WHERE bank_request_id IS NOT NULL;
CREATE INDEX messages_version_idx ON messages (application_id, document_version_id, created_at, id)
    WHERE document_version_id IS NOT NULL;

CREATE TABLE message_attachments (
    application_id uuid NOT NULL,
    message_id uuid NOT NULL,
    document_version_id uuid NOT NULL,
    PRIMARY KEY (message_id, document_version_id),
    FOREIGN KEY (application_id, message_id)
        REFERENCES messages(application_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, document_version_id)
        REFERENCES document_versions(application_id, id) ON DELETE RESTRICT
);
CREATE INDEX message_attachments_version_idx ON message_attachments (application_id, document_version_id);

CREATE TABLE audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
    actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
    action varchar(100) NOT NULL CHECK (btrim(action) <> ''),
    entity_type varchar(64) NOT NULL CHECK (btrim(entity_type) <> ''),
    entity_id uuid NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (application_id, id)
);
CREATE INDEX audit_events_app_timeline_idx ON audit_events (application_id, created_at, id);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_user_id, created_at, id);

CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    audit_event_id uuid NOT NULL,
    title varchar(255) NOT NULL CHECK (btrim(title) <> ''),
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz,
    UNIQUE (recipient_id, audit_event_id),
    FOREIGN KEY (application_id, recipient_id)
        REFERENCES application_participants(application_id, user_id) ON DELETE RESTRICT,
    FOREIGN KEY (application_id, audit_event_id)
        REFERENCES audit_events(application_id, id) ON DELETE RESTRICT,
    CHECK (read_at IS NULL OR read_at >= created_at)
);
CREATE INDEX notifications_unread_idx ON notifications (recipient_id, created_at DESC, id)
    WHERE read_at IS NULL;
CREATE INDEX notifications_app_idx ON notifications (application_id, recipient_id);

CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = credit_mvp, pg_temp AS $$
BEGIN
    NEW.updated_at := statement_timestamp();
    RETURN NEW;
END;
$$;
CREATE TRIGGER users_touch BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER organizations_touch BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER applications_touch BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER requests_touch BEFORE UPDATE ON bank_requests
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER documents_touch BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Preserve uploaded evidence while permitting the scan worker to update its result.
CREATE FUNCTION protect_document_version() RETURNS trigger
LANGUAGE plpgsql SET search_path = credit_mvp, pg_temp AS $$
BEGIN
    IF ROW(NEW.id, NEW.application_id, NEW.document_id, NEW.version_number,
           NEW.uploaded_by, NEW.storage_key, NEW.original_filename,
           NEW.content_type, NEW.size_bytes, NEW.sha256, NEW.uploaded_at)
       IS DISTINCT FROM
       ROW(OLD.id, OLD.application_id, OLD.document_id, OLD.version_number,
           OLD.uploaded_by, OLD.storage_key, OLD.original_filename,
           OLD.content_type, OLD.size_bytes, OLD.sha256, OLD.uploaded_at) THEN
        RAISE EXCEPTION 'Uploaded metadata is immutable; create a new version'
            USING ERRCODE = '23514';
    END IF;
    IF OLD.scan_status IN ('clean', 'infected')
       AND ROW(NEW.scan_status, NEW.scan_completed_at)
           IS DISTINCT FROM ROW(OLD.scan_status, OLD.scan_completed_at) THEN
        RAISE EXCEPTION 'A completed scan is immutable in this MVP'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER document_versions_protect BEFORE UPDATE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION protect_document_version();

CREATE FUNCTION validate_review() RETURNS trigger
LANGUAGE plpgsql SET search_path = credit_mvp, pg_temp AS $$
DECLARE
    file_scan_status text;
BEGIN
    -- Lock the version so scan updates cannot race this check.
    SELECT scan_status INTO file_scan_status FROM document_versions
     WHERE id = NEW.document_version_id AND application_id = NEW.application_id
     FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document version does not belong to this application'
            USING ERRCODE = '23503';
    END IF;
    IF file_scan_status <> 'clean' THEN
        RAISE EXCEPTION 'Only a clean document version can be reviewed'
            USING ERRCODE = '23514';
    END IF;
    PERFORM 1 FROM application_participants
     WHERE application_id = NEW.application_id AND user_id = NEW.reviewed_by
       AND role IN ('manager', 'analyst') AND revoked_at IS NULL
     FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reviewer must be an active bank participant'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER reviews_validate BEFORE INSERT ON document_reviews
    FOR EACH ROW EXECUTE FUNCTION validate_review();

CREATE FUNCTION prevent_history_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = credit_mvp, pg_temp AS $$
BEGIN
    RAISE EXCEPTION 'History table % is append-only', TG_TABLE_NAME
        USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER audit_no_update_delete BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON audit_events
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER reviews_no_update_delete BEFORE UPDATE OR DELETE ON document_reviews
    FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER reviews_no_truncate BEFORE TRUNCATE ON document_reviews
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER versions_no_delete BEFORE DELETE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION prevent_history_mutation();
CREATE TRIGGER versions_no_truncate BEFORE TRUNCATE ON document_versions
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_history_mutation();

COMMIT;
