# SIMS — Secure Investigation Management System
## Source: SIH26190 (Ministry of Home Affairs)
## This file is the SOURCE OF TRUTH. Re-read before starting each phase. Do not deviate without flagging deviations in IMPLEMENTATION_LOG.md.

---

## GLOBAL RULES (apply to every phase, do not relax these)

- This is NOT a generic CRUD app. It is a controlled investigation-record platform covering the FIR to Chargesheet lifecycle for investigating officers, supervising officers, and court/legal reviewers.
- Never claim software output is "admissible," "court-approved," or "High Court accepted." Every generated report/export must be watermarked as system-generated and subject to official verification.
- Never simulate an official electronic signature by drawing one on a PDF. Use a controlled signed-document workflow placeholder instead.
- Do not hard-code legal powers, offence conclusions, or statutory interpretation into UI text. Offence sections must be configurable fields, not baked-in logic.
- No dashboard metric, audit event, activity stream, or "verified" badge may ever be hard-coded or faked. Every number on screen must come from PostgreSQL.
- No browser route may directly expose the file storage directory. All document/evidence reads go through API -> authorization layer -> audit service.
- Hidden frontend buttons are never a valid access control. All authorization is enforced server-side: role + case assignment + jurisdiction + resource sensitivity + action.
- Keep police command hierarchy (State -> Police org -> Division -> Sub-division -> Station) and civil/administrative geography (District -> Taluk -> Locality) as two SEPARATE data dimensions. Never merge them into one hierarchy.
- Do not invent an official police-station-to-subdivision mapping. If it cannot be verified from an authoritative source, mark it DEMO / CONFIGURABLE, editable only by a privileged config role.
- Do not invent a universal record-retention period. Retention is policy-driven, per record class, confirmed by the competent authority — leave it configurable, default to "unset."
- Every write to Documents, Evidence, Custody, Reports produces an immutable new version — never overwrite. Corrections = new version, not an edit.
- Update /docs/IMPLEMENTATION_LOG.md after each phase: what was built, what was deferred, and any ambiguity you resolved on your own judgment.

## TECH STACK

- Frontend: React (Next.js 14 App Router) + TypeScript, Tailwind for styling
- Backend: Next.js API Routes + TypeScript
- ORM/DB: Prisma + PostgreSQL
- Auth: Iron Session (httpOnly cookies) + Argon2id password hashing, MFA hook for privileged roles
- File storage: local/private disk OUTSIDE the public web root, streamed only via authorized API routes
- Validation: Zod DTOs on every write endpoint
- PDF/report generation: server-side (pdf-lib / puppeteer) — never client-only
- Testing: Vitest + Playwright for security/functional test plan

## ARCHITECTURE

Browser (React UI)
  -> authenticated HTTPS session
  -> Security middleware: authentication/session, RBAC + case authorization, input validation/rate limiting, audit event service
  -> Application services: Cases, Documents, Evidence, Custody, Reports, Reviews, Notifications, Search, Readiness
  -> PostgreSQL/Prisma | Private file storage | Hash/integrity service | PDF/court-packet export

No route bypasses the security middleware. CCTNS/ICJS/e-Courts integration is OUT OF SCOPE — expose clean structured APIs/exports only.

## SECURITY BASELINE

| Control    | Requirement                                                       |
|------------|-------------------------------------------------------------------|
| Passwords  | Argon2id. DB stores hashes only.                                  |
| MFA        | Required hook for privileged roles in production config path.     |
| Login      | Rate limiting + failed-attempt counter + temporary lockout.       |
| Sessions   | Idle timeout + absolute expiry + real logout/invalidation.        |
| AuthZ      | role + case assignment + jurisdiction + resource sensitivity.     |
| CORS       | Explicit allow-list of origins only.                              |
| Headers    | Helmet/CSP/security headers on every response.                    |
| Validation | Zod/DTO validation on every write endpoint.                       |
| Secrets    | Env/secret manager only — never committed.                        |
| Files      | Private storage, magic-byte validation, size limits, no path traversal. |
| Downloads  | Authorized backend stream only — never a public storage URL.      |
| Audit      | Append-only, restricted DB access — normal users cannot edit.     |
| Logging    | Structured, redacted (no tokens/passwords), retention policy.     |
| Backups    | Encrypted, with a tested restore path.                            |
| Exports    | Authorization-checked + status watermark on every packet.         |

## CANONICAL DATA MODEL

User(uniqueId, name, role, station, active, passwordHash, mfaEnabled)
Jurisdiction(district, policeDivision, policeSubDivision, policeStation, taluk, locality)
Case(caseId, FIR, title, type, status, priority, station)
CaseAssignment(case, user, role, assignedBy, dates)
Person(personId, category, identifiers)
Location(address, coordinates, locality, taluk)
InvestigationDiaryEntry(date, times, places, proceedings, pageNo, officer)
Document(case, type, description, status)
DocumentVersion(version, filename, size, MIME, SHA256, uploader, time) — IMMUTABLE
Evidence(evidenceId, type, source, collector, status)
EvidenceFile(storageKey, SHA256, algorithm, size, sourceDevice)
CustodyEvent(from, to, actor, action, time, place, purpose, hash) — append-only
Report(case, type, status, createdBy)
ReportVersion(version, SHA256, author, time) — IMMUTABLE
Review(reviewer, decision, comments, time)
Certificate(sourceDevice, certifier, hash, algorithm, date, time, place)
Notification(user, type, resource, readAt)
AuditLog(actor, role, action, resource, case, result, metadata) — restricted, append-only

## DOCUMENT VAULT UPLOAD FLOW

1. Officer selects an authorized case + document type.
2. Multipart upload to an authenticated API endpoint.
3. Server validates size, extension, MIME, AND magic bytes (never trust browser MIME alone).
4. Server generates a non-user-controlled storage key.
5. File written to private storage outside the public web root.
6. Server computes SHA-256 from the actually-stored bytes.
7. DB creates Document + DocumentVersion in one transaction.
8. Audit event DOCUMENT_UPLOADED written.
9. UI reloads from persisted data (not optimistic fake state).
10. A replacement upload creates a NEW version — prior version is never overwritten.

## EVIDENCE, INTEGRITY & CHAIN OF CUSTODY

Stages: Collection -> Registration -> Acquisition -> Integrity -> Custody -> Examination -> Sealing -> Court production -> Return/disposal.

Evidence detail view must show: stored hash, RECOMPUTED hash (actually recomputed on demand, not cached), algorithm, match result, storage identity, file size, source/device metadata, current custodian, full custody history.

If stored file has been altered, integrity verification MUST return FAILURE and create an integrity-failure audit event. Never hard-code a green "verified" state.

## INVESTIGATION DIARY vs. AUDIT TRAIL

(A) Investigation Diary / Daily Proceedings — substantive investigative record.
(B) Technical Audit Trail — system/security activity log.
Do NOT conflate these into a single "activity log" screen.

## INVESTIGATION GRAPH

Real relationship graph backed by PostgreSQL — not a decorative static diagram.
Node types: Case, FIR/Offence, People, Events, Locations, Documents, Evidence, Devices, Forensic Reports, Custody Events, Investigation Reports, Legal/Court References.
Every graph node must map to a persisted DB row.

## REPORT BUILDER

Structured data FIRST, PDF generation second.
Lifecycle: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / RETURNED -> FINAL.
Every correction creates a new immutable version.

## COURT / LEGAL PREPARATION PACKET

Mandatory PDF footer on every page:
"Generated by SIMS • Case ID • Document/Report ID • Version • SHA-256 • Generated timestamp • Page number • SYSTEM-GENERATED / SUBJECT TO OFFICIAL VERIFICATION & APPROVAL."

## JURISDICTION MODEL (Bengaluru South prototype)

Police command and administrative geography are PARALLEL SEPARATE dimensions:
- Police: Government of Karnataka -> Karnataka State Police -> Bengaluru City Police -> South Division -> Police Station -> Case
- Administrative: Bengaluru Urban District -> Taluk -> Hobli/ward/locality

Do not invent a station-to-subdivision list. If unverified, mark DEMO/CONFIGURABLE.

## ROLE & AUTHORIZATION MATRIX

Roles: Investigating Officer (IO), Supervisor, Legal, Config(admin).
Enforce ALL authorization server-side. Role alone is never sufficient — always also check case assignment + jurisdiction + resource sensitivity + action.

## PHASED IMPLEMENTATION ORDER

Phase 0  — Baseline scaffold: git init, DB, route inventory, clean build
Phase 1  — Authentication: secure login/session/rate-limit/lockout/audit
Phase 2  — Documents: private upload/hash/version/download end-to-end
Phase 3  — Evidence: registration + integrity verification + custody + certificate fields
Phase 4  — Investigation Diary + Timeline + relationship data model
Phase 5  — Reports: structured builder + versioning + review workflow + PDF export
Phase 6  — Graph: DB-backed investigation relationship graph
Phase 7  — Search + Notifications: authorization-aware search, persistent notifications
Phase 8  — Readiness + Export packet (watermark/footer rule)
Phase 9  — Jurisdiction: Bengaluru South configuration, verified or DEMO/CONFIGURABLE
Phase 10 — Hardening: full security/functional test plan, backup/restore, final builds

After each phase: run build + relevant tests, report exact output, update /docs/IMPLEMENTATION_LOG.md, STOP for review.

## KNOWN BUG TO AVOID

Documents/Evidence/Timeline/Reports sidebar items must NOT render the Cases page.
Add a smoke test that visits every sidebar route and asserts the expected page-level heading renders.

## FINAL ACCEPTANCE CHECKLIST

[ ] Real authentication — no demo role-switch bypass
[ ] Passwords never stored plaintext
[ ] Unassigned users cannot access cases
[ ] Documents actually upload and persist
[ ] Downloads are authorized and audited
[ ] Document versions immutable and hashed
[ ] Evidence has provenance and integrity verification
[ ] Custody history is append-only
[ ] Investigation diary and technical audit trail are distinct features
[ ] Timeline is database-backed
[ ] Investigation graph is database-backed
[ ] Reports are structured and versioned
[ ] Supervisor review is persisted
[ ] Notifications are persisted
[ ] Search is authorization-aware
[ ] Dashboard metrics are PostgreSQL-backed
[ ] Electronic-record certificate captures applicable BSA schedule fields
[ ] Court/legal packet clearly marked system-generated / subject to official verification
[ ] Police hierarchy and taluk/administrative geography are not conflated
[ ] Official station mapping is verified or explicitly marked configurable
[ ] Frontend build passes
[ ] Backend build passes
[ ] Prisma validation/generation/migrations pass
[ ] Security tests pass
[ ] Backup/restore test passes
[ ] No production secrets committed
