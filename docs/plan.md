# AdFlow Pro — Implementation Plan

**Stack:** MERN (MongoDB + Mongoose, Express, React + Vite, Node.js) · **Storage:** AWS S3 (presigned uploads) · **Auth:** JWT · **Validation:** Zod · **UI:** Tailwind CSS · **Jobs:** node-cron (or Agenda/BullMQ).

**Note on media:** The spec mandates "external URLs only, no local upload." Because we are using S3, we treat S3 as our first-class media store (ad images + payment screenshots) and keep the external-URL normalization pipeline (YouTube thumbnails, public image URLs) as a secondary source. Every media row still carries `source_type`, `original_url`, `thumbnail_url`, and `validation_status`.

**Legend:** Each phase ≈ 1 week. Phases contain Milestones; Milestones contain Modules. Acceptance criteria are listed at the end of each phase.

---

## Phase 1 — Foundation, Auth & Data Model (Week 1)

Goal: a runnable client+server skeleton, all Mongoose schemas in place, JWT + RBAC working end-to-end, and the public shell of the site rendering.

### ✅ Milestone 1.1 — Project Setup & Tooling
- Monorepo layout: `/server` (Express) and `/client` (React + Vite).
- Server bootstrap: Express, Mongoose, Bun native env, error middleware, morgan logger.
- Client bootstrap: React 19 + Vite 8, React Router 7, Tailwind v4, Axios instance with interceptors.
- Tooling: TypeScript full-stack, Bun runtime/package manager, `.env.example` both sides.
- Base API contract: standard `{ ok, data, error }` response envelope.

### ✅ Milestone 1.2 — Database Schemas (Mongoose)
- `User` (email, password_hash, role: client/moderator/admin/super_admin, status).
- `SellerProfile` (display_name, business_name, phone, city, is_verified).
- `Package` (name, duration_days, weight, is_featured, price, refresh_rule).
- `Category` and `City` (name, slug, is_active).
- `Ad` (user_id, package_id, title, slug, category_id, city_id, description, status, publish_at, expire_at, rank_score, admin_boost, view_count).
- `AdMedia` (ad_id, source_type[s3|youtube|external], original_url, thumbnail_url, s3_key, validation_status).
- `Payment` (ad_id, amount, method, transaction_ref [unique sparse index], sender_name, screenshot_s3_key, status, verified_by, verified_at).
- `Notification` (user_id, title, message, type, is_read, link).
- `AuditLog` (actor_id, action_type, target_type, target_id, old_value, new_value).
- `AdStatusHistory` (ad_id, previous_status, new_status, changed_by, note).
- `LearningQuestion` (question, answer, topic, difficulty, is_active).
- `SystemHealthLog` (source, response_ms, checked_at, status).
- Indexes: `Ad.slug` unique, `Ad.status + expire_at`, `Payment.transaction_ref` unique sparse, text index on `Ad.title + description`.

### ✅ Milestone 1.3 — Authentication & RBAC
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`.
- bcrypt password hashing, JWT access + refresh tokens.
- `requireAuth` middleware and `requireRole(...roles)` guard.
- Frontend: Zustand authStore, protected routes, login/register pages, role-aware redirects.
- Seed script (`server/scripts/seed.ts`): 4 users (super_admin/moderator/admin/client), 3 packages, 8 categories, 6 cities, 10 learning questions.

### ✅ Milestone 1.4 — Public Shell & Static Pages
- Layout: Header (nav + auth state + theme toggle + mobile Sheet drawer), Footer (4-col links).
- Landing page: hero, categories grid, featured-ads slot (skeleton), how-it-works, packages strip, recent-ads slot (skeleton), trust section, CTA banner.
- Static pages: FAQ (accordion), Contact, Terms, Privacy, Usage Policy.
- Design tokens configured in Tailwind v4 (oklch CSS vars).

**Phase 1 Acceptance:** Server boots, connects to Mongo, all models defined; a user can register, log in, see role-appropriate landing nav; static pages render; ESLint passes.

---

## Phase 2 — Client Ad Lifecycle & S3 Media (Week 2)

Goal: clients can create drafts, attach S3-hosted media (and/or external URLs), pick a package, submit payment proof, and watch status transitions.

### Milestone 2.1 — AWS S3 Media Pipeline
- S3 bucket provisioning (private bucket + IAM user with least-privilege policy).
- `POST /api/media/presign` → returns short-lived presigned PUT URL + final object key.
- Server-side validation of upload metadata (mimetype allowlist, max size).
- `POST /api/media/confirm` → records the `AdMedia` row after client-side upload succeeds.
- Thumbnail generation: server downloads from S3 and produces a `_thumb.webp` via `sharp`, then writes back to S3 under `thumbs/`.
- CloudFront (or signed GET URL) layer for public reads.
- Frontend uploader component with drag-drop, progress bar, and preview.

### Milestone 2.2 — External Media Normalization (fallback)
- YouTube URL parser → extract video ID → build `img.youtube.com/vi/<id>/hqdefault.jpg`.
- Public image URL validator (protocol, extension, host allowlist).
- Placeholder image when `validation_status = failed`.

### Milestone 2.3 — Taxonomy & Package APIs
- `GET /api/packages`, `GET /api/categories`, `GET /api/cities` (public).
- Super-admin CRUD endpoints for each (gated for Phase 3 UI).
- Frontend Packages page rendering active packages with benefits.

### Milestone 2.4 — Ad Draft & Submission
- `POST /api/client/ads` (create draft), `PATCH /api/client/ads/:id` (edit draft).
- Slug generation with collision suffix; Zod validation of title/description/category/city.
- `POST /api/client/ads/:id/submit` → status transition Draft → Submitted; writes `AdStatusHistory` + `AuditLog`.
- `GET /api/client/ads` and `GET /api/client/ads/:id` for own listings.

### Milestone 2.5 — Client Dashboard UI
- Tabs: Drafts · Under Review · Payment Pending · Published · Expired · Rejected.
- Ad form (create/edit) with multi-step UX: details → media → package → review.
- Status tracker timeline per ad showing every `AdStatusHistory` entry.
- Profile + seller profile editing.

### Milestone 2.6 — Payment Submission
- `POST /api/client/payments` (ad_id, amount, method, transaction_ref, sender_name, optional screenshot via S3 presign).
- Duplicate `transaction_ref` rejected with clear error.
- Status transitions: Payment Pending → Payment Submitted on success.
- Client UI: "Submit Payment" form gated to ads in `Payment Pending` state; lists past attempts.

**Phase 2 Acceptance:** A client can create an ad, upload images to S3, pick a package, submit it, see it move into review, and submit payment proof. All transitions write to `AdStatusHistory` and `AuditLog`.

---

## Phase 3 — Moderation, Admin Verification & Publishing (Week 3)

Goal: moderator and admin workflows make ads ready to go live; super-admin manages taxonomy, packages, and users; notifications fire on transitions.

### Milestone 3.1 — Moderator Review Workflow
- `GET /api/moderator/review-queue` with filter, sort, pagination.
- `PATCH /api/moderator/ads/:id/review` actions: `approve_content` → Payment Pending · `reject` (with reason) · `flag` (suspicious/duplicate) · `add_note`.
- Append `AdStatusHistory` + `AuditLog` on every action.
- Moderator UI: queue list, ad detail with media preview, action panel, internal notes thread.

### Milestone 3.2 — Admin Payment Verification
- `GET /api/admin/payment-queue` (payments with status = submitted).
- `PATCH /api/admin/payments/:id/verify` → verify or reject with note.
- Side panel showing ad summary + screenshot from S3 (signed URL).
- Reject path notifies client and reverts ad to Payment Pending.

### Milestone 3.3 — Publishing & Scheduling
- `PATCH /api/admin/ads/:id/publish` with optional `publish_at`; auto-compute `expire_at = publish_at + package.duration_days`.
- `PATCH /api/admin/ads/:id/feature` (toggle featured + `admin_boost` value).
- Admin UI: publish-now / schedule-for-date, featured toggle, manual rank boost slider.

### Milestone 3.4 — Admin & Super-Admin Console
- User management: list, filter by role, suspend, change role (super-admin only).
- Package management (super-admin): full CRUD + activate/deactivate.
- Category & City management with slug auto-generation.
- System settings page (featured rules, default package, contact email).

### Milestone 3.5 — Notifications
- `Notification` create helpers fired on: ad submitted, content approved, content rejected, payment verified, payment rejected, ad published, ad expiring (48h), ad expired.
- `GET /api/notifications` and `PATCH /api/notifications/:id/read`.
- Bell icon UI with unread count and dropdown list.
- Optional email channel via AWS SES (off by default behind feature flag).

**Phase 3 Acceptance:** A submitted ad can be reviewed by a moderator, paid for by a client, verified by an admin, and scheduled/published. All four roles have working dashboards.

---

## Phase 4 — Public Experience, Automation, Analytics & Deployment (Week 4)

Goal: public-facing browsing with ranking, cron-driven lifecycle automation, analytics, hardening, and deployment.

### Milestone 4.1 — Public Ad Browsing
- `GET /api/ads` with filters (category, city, package, price range), sort (newest, rank, price), pagination.
- `GET /api/ads/:slug` for detail page; increments `view_count`.
- Active-status screening: only `status=published` AND `publish_at <= now` AND `expire_at > now`.
- Explore page UI with sticky filter sidebar, results grid, empty states.
- Ad detail page with image gallery, seller summary, package badge, expiry countdown, report button.
- `POST /api/ads/:id/report` with reason; super-admin reports queue.

### Milestone 4.2 — Category, City & Landing Composition
- `/categories/:slug` and `/cities/:slug` listing pages.
- Landing page filled in: featured carousel, recent ads grid, package strip, learning question widget (`GET /api/questions/random`).

### Milestone 4.3 — Ranking Engine
- `rank_score` computed on publish + on a periodic recompute job:
  `rank_score = (package.weight * 100) + featured_bonus + freshness_decay(publish_at) + admin_boost`.
- Index `Ad.rank_score` for fast sort.
- Freshness decay function unit-tested.

### Milestone 4.4 — Scheduled Automation
- `node-cron` (or Agenda) registered at boot, idempotent jobs:
  - **Publish-scheduled** (hourly): publish ads where `status=scheduled` AND `publish_at <= now`.
  - **Expire-ads** (daily): set `expired` where `expire_at <= now` AND `status=published`.
  - **Expiring-soon notify** (daily): notify owners 48h before expiry.
  - **Rank recompute** (every 6h).
  - **DB heartbeat** (every 5 min): insert `SystemHealthLog`.
- Cron-trigger endpoints (`POST /api/cron/*`) protected by a shared secret for manual runs.
- Each job writes start/end + outcome to `AuditLog`.

### Milestone 4.5 — Analytics Dashboard
- Aggregation endpoint `GET /api/admin/analytics/summary` returning KPI groups: Listings, Revenue, Moderation, Taxonomy, Operations.
- Frontend dashboard with Recharts (or Chart.js): summary cards, bar chart for revenue-by-package, donut for moderation approval rate, horizontal bar for ads-by-category/city, status cards for cron health.
- Date-range picker; CSV export of revenue table.

### Milestone 4.6 — System Health & Audit
- `GET /api/health/db` (Mongo ping + write-test).
- Super-admin pages: health-log viewer, audit-log viewer with actor + action filters, ad-status-history search.

### Milestone 4.7 — Hardening
- Rate limiting (`express-rate-limit`) on auth + media presign endpoints.
- `helmet`, strict CORS allowlist, request size limits.
- Input sanitization layer (`express-mongo-sanitize`, `xss-clean`).
- S3 bucket policy review; CloudFront signed URLs for private content.
- Secrets in environment; nothing committed.

### Milestone 4.8 — Seed Data & Documentation
- Seed script: 4 users (one per role), 3 packages, 8 categories, 6 cities, 20 ads spanning every status, 12 payments, 10 learning questions.
- Postman collection covering every endpoint with example payloads.
- `README.md` with run instructions, env vars, deploy steps, architecture diagram.
- Short demo recording or screenshots.

### Milestone 4.9 — Deployment
- MongoDB Atlas cluster (prod + staging).
- S3 bucket + CloudFront distribution + IAM role.
- Backend: Render or Railway (Node service) with env vars and health check.
- Frontend: Vercel with API base URL env.
- Domain + HTTPS (Let's Encrypt via host).
- Smoke test checklist run against the deployed URL.

**Phase 4 Acceptance:** Public users browse and report ads; scheduled jobs run on time; analytics dashboard renders live data; the deployed URL passes the smoke test.

---

## Cross-Cutting Concerns (apply to every phase)

- **Audit trail:** every status transition writes `AdStatusHistory` + `AuditLog`.
- **Validation:** Zod schemas shared between client and server where practical.
- **Error handling:** central Express error middleware, typed error codes.
- **Testing:** Jest unit tests for ranking, status transitions, payment dedupe; Supertest for critical API flows.
- **Observability:** structured logs (pino), request IDs, slow-query warnings.

## Extra Credit (optional, drop-in modules)

- Saved-ads / bookmarks (User-Ad join collection + heart button).
- Duplicate detection (phone-number hash + title trigram similarity).
- Coupon codes on packages.
- Seller verification badges (manual super-admin toggle).
- WhatsApp notification channel (Twilio).
- Materialized analytics snapshots (nightly aggregation collection).
- Soft delete + archive recovery for ads.

## Suggested Folder Structure

```
AddFlow/
├── server/
│   ├── src/
│   │   ├── config/        # env, db, s3
│   │   ├── models/        # mongoose schemas
│   │   ├── routes/        # express routers grouped by role
│   │   ├── controllers/
│   │   ├── services/      # ranking, media, payments, notifications
│   │   ├── middleware/    # auth, rbac, error
│   │   ├── jobs/          # cron tasks
│   │   ├── validators/    # zod schemas
│   │   └── utils/
│   ├── scripts/seed.js
│   └── tests/
└── client/
    ├── src/
    │   ├── pages/         # public, client, moderator, admin
    │   ├── components/
    │   ├── features/      # ads, payments, auth, analytics
    │   ├── context/
    │   ├── hooks/
    │   ├── lib/api.js
    │   └── styles/
    └── public/
```

## Weekly Deliverables Recap

| Phase | Week | Deliverable |
|-------|------|-------------|
| 1 | 1 | Skeleton app + auth + RBAC + all schemas + public shell |
| 2 | 2 | Client can create ad, upload to S3, submit payment |
| 3 | 3 | Moderator + admin + super-admin workflows complete |
| 4 | 4 | Public site, ranking, cron, analytics, deployed |
