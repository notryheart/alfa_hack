-- Run with: psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f checks.sql
-- All fixtures are synthetic and rolled back, including on successful checks.
BEGIN;
SET LOCAL search_path = credit_mvp, public;

DO $$
DECLARE
    client_id uuid := gen_random_uuid();
    banker_id uuid := gen_random_uuid();
    other_client_id uuid := gen_random_uuid();
    org_id uuid := gen_random_uuid();
    app1 uuid := gen_random_uuid();
    app2 uuid := gen_random_uuid();
    req1 uuid := gen_random_uuid();
    req2 uuid := gen_random_uuid();
    doc1 uuid := gen_random_uuid();
    doc2 uuid := gen_random_uuid();
    v1 uuid := gen_random_uuid();
    v2 uuid := gen_random_uuid();
    other_v uuid := gen_random_uuid();
    msg1 uuid := gen_random_uuid();
    event1 uuid := gen_random_uuid();
    event2 uuid := gen_random_uuid();
    failed_cases integer := 0;
BEGIN
    INSERT INTO users(id, email, display_name) VALUES
        (client_id, client_id::text || '@example.test', 'Демо-клиент'),
        (banker_id, banker_id::text || '@example.test', 'Демо-сотрудник'),
        (other_client_id, other_client_id::text || '@example.test', 'Другой участник');
    INSERT INTO organizations(id, name, inn) VALUES
        (org_id, 'Синтетическая организация для проверки', '0000000000');
    INSERT INTO organization_members(organization_id, user_id) VALUES
        (org_id, client_id), (org_id, other_client_id);
    INSERT INTO applications(id, number, organization_id, created_by, product_code,
                             requested_amount, term_months) VALUES
        (app1, app1::text, org_id, client_id, 'working_capital', 1000000, 12),
        (app2, app2::text, org_id, other_client_id, 'working_capital', 2000000, 24);
    INSERT INTO application_participants(application_id, user_id, role) VALUES
        (app1, client_id, 'client'), (app1, banker_id, 'manager'),
        (app2, other_client_id, 'client'), (app2, banker_id, 'manager');
    INSERT INTO bank_requests(id, application_id, created_by, title, description) VALUES
        (req1, app1, banker_id, 'Отчётность', 'Загрузите актуальный отчёт'),
        (req2, app2, banker_id, 'Другой запрос', 'Документ другой заявки');
    INSERT INTO documents(id, application_id, bank_request_id, title, document_type) VALUES
        (doc1, app1, req1, 'Отчётность', 'financial_statement'),
        (doc2, app2, req2, 'Отчётность второй заявки', 'financial_statement');
    INSERT INTO document_versions(id, application_id, document_id, version_number,
        uploaded_by, storage_key, original_filename, content_type, size_bytes,
        sha256, scan_status, scan_completed_at) VALUES
        (v1, app1, doc1, 1, client_id, v1::text, 'report_v1.pdf', 'application/pdf',
         100, repeat('a',64), 'clean', now()),
        (v2, app1, doc1, 2, client_id, v2::text, 'report_v2.pdf', 'application/pdf',
         120, repeat('b',64), 'pending', NULL),
        (other_v, app2, doc2, 1, other_client_id, other_v::text, 'other.pdf',
         'application/pdf', 130, repeat('c',64), 'clean', now());

    BEGIN
        INSERT INTO applications(number, organization_id, created_by, product_code,
                                 requested_amount, term_months)
        VALUES (gen_random_uuid()::text, org_id, client_id, 'demo', -1, 12);
        RAISE EXCEPTION 'FAIL: negative amount was accepted';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        INSERT INTO documents(application_id, bank_request_id, title, document_type)
        VALUES (app1, req2, 'Cross-application document', 'demo');
        RAISE EXCEPTION 'FAIL: cross-application request was accepted';
    EXCEPTION WHEN foreign_key_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        INSERT INTO document_versions(application_id, document_id, version_number,
            uploaded_by, storage_key, original_filename, content_type, size_bytes, sha256)
        VALUES (app1, doc2, 2, client_id, gen_random_uuid()::text, 'x.pdf',
                'application/pdf', 10, repeat('d',64));
        RAISE EXCEPTION 'FAIL: version of another application document was accepted';
    EXCEPTION WHEN foreign_key_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        INSERT INTO document_versions(application_id, document_id, version_number,
            uploaded_by, storage_key, original_filename, content_type, size_bytes, sha256)
        VALUES (app1, doc1, 1, client_id, gen_random_uuid()::text, 'x.pdf',
                'application/pdf', 10, repeat('d',64));
        RAISE EXCEPTION 'FAIL: duplicate version number was accepted';
    EXCEPTION WHEN unique_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        INSERT INTO document_reviews(application_id, document_version_id, reviewed_by, decision)
        VALUES (app1, v2, banker_id, 'accepted');
        RAISE EXCEPTION 'FAIL: unscanned version was accepted for review';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        INSERT INTO document_reviews(application_id, document_version_id, reviewed_by, decision)
        VALUES (app1, v1, banker_id, 'changes_requested');
        RAISE EXCEPTION 'FAIL: missing rejection comment was accepted';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    INSERT INTO document_reviews(application_id, document_version_id, reviewed_by, decision, comment)
    VALUES (app1, v1, banker_id, 'changes_requested', 'Добавьте недостающую страницу');

    UPDATE document_versions SET scan_status = 'clean', scan_completed_at = now()
    WHERE id = v2;
    BEGIN
        INSERT INTO document_reviews(application_id, document_version_id, reviewed_by, decision)
        VALUES (app1, v2, client_id, 'accepted');
        RAISE EXCEPTION 'FAIL: client was allowed to review a document';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    INSERT INTO document_reviews(application_id, document_version_id, reviewed_by, decision)
    VALUES (app1, v2, banker_id, 'accepted');

    INSERT INTO messages(id, application_id, author_id, bank_request_id, body)
    VALUES (msg1, app1, client_id, req1, 'Загрузил исправленный документ');
    INSERT INTO message_attachments(application_id, message_id, document_version_id)
    VALUES (app1, msg1, v2);
    BEGIN
        INSERT INTO messages(application_id, author_id, bank_request_id, body)
        VALUES (app1, client_id, req2, 'Cross-application message');
        RAISE EXCEPTION 'FAIL: cross-application message context was accepted';
    EXCEPTION WHEN foreign_key_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        INSERT INTO message_attachments(application_id, message_id, document_version_id)
        VALUES (app1, msg1, other_v);
        RAISE EXCEPTION 'FAIL: cross-application attachment was accepted';
    EXCEPTION WHEN foreign_key_violation THEN failed_cases := failed_cases + 1;
    END;

    INSERT INTO audit_events(id, application_id, actor_user_id, action, entity_type, entity_id)
    VALUES
        (event1, app1, banker_id, 'document.accepted', 'document_version', v2),
        (event2, app2, banker_id, 'request.created', 'bank_request', req2);
    INSERT INTO notifications(application_id, recipient_id, audit_event_id, title)
    VALUES (app1, client_id, event1, 'Документ принят');
    BEGIN
        INSERT INTO notifications(application_id, recipient_id, audit_event_id, title)
        VALUES (app1, client_id, event1, 'Повтор');
        RAISE EXCEPTION 'FAIL: duplicate notification was accepted';
    EXCEPTION WHEN unique_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        INSERT INTO notifications(application_id, recipient_id, audit_event_id, title)
        VALUES (app1, client_id, event2, 'Другая заявка');
        RAISE EXCEPTION 'FAIL: notification linked to another application event';
    EXCEPTION WHEN foreign_key_violation THEN failed_cases := failed_cases + 1;
    END;

    BEGIN
        UPDATE audit_events SET action = 'overwritten' WHERE id = event1;
        RAISE EXCEPTION 'FAIL: audit event was overwritten';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        UPDATE document_reviews SET decision = 'accepted' WHERE document_version_id = v1;
        RAISE EXCEPTION 'FAIL: historical review was overwritten';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        UPDATE document_versions SET sha256 = repeat('e',64) WHERE id = v1;
        RAISE EXCEPTION 'FAIL: uploaded version metadata was overwritten';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        UPDATE document_versions SET scan_status = 'pending', scan_completed_at = NULL
        WHERE id = v2;
        RAISE EXCEPTION 'FAIL: terminal scan result was overwritten';
    EXCEPTION WHEN check_violation THEN failed_cases := failed_cases + 1;
    END;
    BEGIN
        UPDATE application_participants SET role = 'manager'
        WHERE application_id = app1 AND user_id = client_id;
        RAISE EXCEPTION 'FAIL: second active manager was accepted';
    EXCEPTION WHEN unique_violation THEN failed_cases := failed_cases + 1;
    END;

    IF failed_cases <> 16 THEN
        RAISE EXCEPTION 'FAIL: expected 16 rejected cases, got %', failed_cases;
    END IF;
    IF (SELECT count(*) FROM document_versions WHERE document_id = doc1) <> 2
       OR NOT EXISTS (SELECT 1 FROM document_reviews
                      WHERE document_version_id = v1 AND decision = 'changes_requested')
       OR NOT EXISTS (SELECT 1 FROM document_reviews
                      WHERE document_version_id = v2 AND decision = 'accepted') THEN
        RAISE EXCEPTION 'FAIL: version and review history was not preserved';
    END IF;
    RAISE NOTICE 'PASS: two-version workflow and 16 invalid operations rejected. Fixtures will be rolled back.';
END;
$$;
ROLLBACK;
