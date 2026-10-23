# Backend boundary and schema mapping

## What exists now

The working workspace is a **synthetic browser demo**, not an authenticated banking system. React state owns all demo mutations. Only synthetic state/metadata is saved to `sessionStorage`; uploaded file bytes remain in memory and are cleared on exit. Switching demo roles preserves the session to demonstrate collaboration; logout/reset clears it. Open the demo in a single tab for a shared scenario.

The Django/DRF/PostgreSQL directory is a **fail-closed scaffold**, not a production backend. `/api/health/` is liveness only. Other `/api/*` paths require authentication and return `501`, not invented data. There is no real sign-in or file scanning. The frontend API adapter is deliberately not wired to the demo.

No `schema.sql`, `checks.sql`, or discovery brief was supplied. No domain migrations/tables were created. Do not apply a second ORM schema over the eventual SQL. Obtain and inspect the existing schema, map entities and constraints below, then implement the API against that source of truth.

## Domain mapping checklist (proposals, not migrations)

| UI entity | Required mapping / invariant |
| --- | --- |
| Organization, user, membership | Client membership determines application access. Never trust organization IDs supplied by a client. |
| Application, participant | Manager/analyst permissions are per application; system admin is a separate permission, not automatic access to borrower data. All seeded staff are treated as assigned to the three demo applications only in the mock. |
| Application parameters | Product must be allowed by backend. Monetary value is a decimal string in request/response, with supported precision and currency; term is integer months. |
| Bank request | Creator, title, explanation, optional due date, explicit resolved flag, linked document slots. Resolve is an explicit authorized server action. |
| Document slot | Requirement belongs to one application. Readiness derives from required slots' **current** versions with review `accepted`. No required slots means requirements are not defined, not 100% ready. |
| Document version | Immutable file metadata, uploader, version sequence, created timestamp. New versions start `pending`; acceptance of an old version does not carry forward. |
| File safety / review | Separate scan status from review status. Demo scans are `not_performed`. API mode must quarantine/block unsafe or unscanned files according to bank policy; a clean scan never grants acceptance. |
| Context message | Application scope plus typed context (`application`, `request`, or `document_version`). Verify both the context and application membership. |
| Activity | Server-generated, append-only event records, actor, time, resource deep link. Client must not be able to forge history. |
| Notification | User-specific, scoped to accessible resources, read/unread state. Demo uses one shared event feed for role-switching; real notifications must be per recipient. |

Schema changes may be necessary for version-level reviews, document-slot requirements, typed conversations, participants, and server event records. Confirm against SQL first and record exact migrations here.

## Proposed REST contract

Base path `/api/`. Use same-origin secure session cookies + CSRF on mutations. Return `401/403` as appropriate, `404` for unknown/inaccessible resources according to policy, `409` for stale versions/conflicts, `422` or DRF `400` for field errors. Validate every object and action on the server.

| Method | Resource | Permission / behavior |
| --- | --- | --- |
| GET | `applications/` | Only accessible applications; paginated in production |
| POST | `applications/` | Client; validate membership, product, decimal amount, term, contact |
| GET/PATCH | `applications/:id/` | Participant; PATCH only permitted fields and draft transitions |
| POST | `applications/:id/submit/` | Client participant, valid draft |
| GET/POST | `applications/:id/requests/` | Participants read; assigned staff create |
| POST | `requests/:id/resolve/` | Assigned staff, all linked current versions accepted, concurrency checked |
| GET | `applications/:id/documents/` | Participant; slots and immutable version metadata |
| POST | `documents/:id/versions/` | Client participant; authenticated multipart upload, content sniffing/size checks, quarantine |
| GET | `versions/:id/file/` | Authorized, safe-file gate; short-lived download, no public object URLs |
| POST | `versions/:id/review/` | Assigned staff; current safe version only; correction requires concrete explanation |
| GET/POST | `applications/:id/messages/?context=...` | Participant, context belongs to application |
| GET | `applications/:id/history/` | Participant, server events only |
| GET/PATCH | `notifications/` | Current recipient only |
| GET/PATCH | `me/` | Own profile, no self-granting permissions |
| GET/PATCH | `integrations/` | System administrators; secrets never returned to browser |

Example application POST:

```json
{
  "organization_id": "server-authorized-organization",
  "product_id": "server-allowed-product",
  "amount": "15000000.00",
  "currency": "RUB",
  "term": 24,
  "contact": "synthetic@example.test",
  "status": "draft"
}
```

`src/api.ts` currently uses the demo's camel-case DTO shape for discovery. Introduce a dedicated serializer/DTO mapping once the schema and real endpoint formats are known; do not silently use UI product labels as backend IDs. Add API-backed drafts, structured loading/error/retry states, idempotent uploads, pagination, cache scoping, and real authorization tests before enabling API mode.

## Deliberate MVP limits

- Demo role guards demonstrate navigation only. Browser state is editable and **is not security**.
- Files: PDF, PNG, JPEG up to 20 MB. Client checks improve UX only. No external services, scanning, e-signature, scoring, or lending decisions.
- Synthetic source documents use an explicitly labeled illustrative preview. Uploaded bytes cannot be recovered after refresh; metadata and review remain for the synthetic scenario.
- No organization switching or cross-tab collaboration. New demo applications wait for staff-defined requirements rather than receiving an invented automatic checklist.
- Notification demo feed is shared within a role-switching session. Deadlines are created relative to the first seed date.
- Application status is manually modeled, independent of document readiness. Resolving requests never approves credit.
- PostgreSQL connectivity, migrations, storage, authentication, and real integrations remain unimplemented/unverified pending the schema and bank requirements.
