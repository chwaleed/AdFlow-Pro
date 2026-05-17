# AdFlow Pro — Implementation Plan

**Stack:** MERN (MongoDB + Mongoose, Express, React + Vite, Node.js) · **Storage:** Multer + local `server/uploads/` folder (S3 skipped for now) · **Auth:** JWT · **Validation:** Zod · **UI:** Tailwind CSS · **Jobs:** node-cron (or Agenda/BullMQ).

**Note on media:** AWS S3 is skipped for now. File uploads use **multer** (`diskStorage`) saving to `server/uploads/`. Files are served as static assets at `/uploads/<filename>`. `AdMedia.source_type` supports `'local' | 'youtube' | 'external' | 's3'`. Payment screenshots are uploaded the same way. Every media row still carries `source_type`, `original_url`, `thumbnail_url`, and `validation_status`.

**Legend:** Each phase ≈ 1 week. Phases contain Milestones; Milestones contain Modules. Acceptance criteria are listed at the end of each phase.

---

## Phase 1 — Foundation, Auth & Data Model (Week 1)

Goal: a runnable client+server skeleton, all Mongoose schemas in place, JWT + RBAC working end-to-end, and the public shell of the site rendering.

### ✅ Milestone 1.1 — Project Setup & Tooling
- Monorepo layout: `/server` (Express) and `/client` (React + Vite).
- Server bootstrap: Express, Mongoose, environment validation, error middleware, morgan logger.
- Client bootstrap: React 19 + Vite 8, React Router 7, Tailwind v4, Axios instance with interceptors.
- Tooling: TypeScript full-stack, pnpm package manager, `.env.example` both sides.
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

### ✅ Milestone 2.1 — Local File Upload Pipeline (multer, S3 skipped)
- Multer `diskStorage` middleware saving to `server/uploads/` (`middleware/upload.ts`).
- `POST /api/media/upload` → accepts multipart `file`, creates `AdMedia` row with `source_type: 'local'`.
- `POST /api/media/confirm` → links a media record to an ad after upload.
- `DELETE /api/media/:id` → removes record + deletes file from disk.
- Static serving: `GET /uploads/<filename>` via `express.static`.
- `AdMedia.source_type` enum extended with `'local'`.

### ✅ Milestone 2.2 — External Media Normalization
- `services/media.service.ts`: `parseYouTubeUrl`, `validateExternalImageUrl`, `normalizeMediaInput`.
- YouTube URL → `img.youtube.com/vi/<id>/hqdefault.jpg` thumbnail.
- External HTTPS image URLs validated by extension and protocol.
- `validation_status: 'failed'` set when URL does not match any valid pattern.

### ✅ Milestone 2.3 — Taxonomy & Package APIs
- `GET /api/packages`, `GET /api/categories`, `GET /api/cities` (public, no auth).
- `GET /api/packages/:id`, `/api/categories/:id`, `/api/cities/:id`.
- Super-admin CRUD: `POST/PATCH/DELETE` for all three resources.
- Slug auto-generation with collision suffix for categories and cities.
- Soft-delete via `is_active: false`.

### ✅ Milestone 2.4 — Ad Draft & Submission
- `POST /api/client/ads` (create draft), `PATCH /api/client/ads/:id` (edit draft).
- Slug generation utility (`utils/slug.ts`) with collision suffix.
- Zod validation via `validators/client-ads.validator.ts`.
- `POST /api/client/ads/:id/submit` → `draft → submitted`; writes `AdStatusHistory` + `AuditLog`.
- `GET /api/client/ads` (paginated, filterable by status) + `GET /api/client/ads/:id`.
- `DELETE /api/client/ads/:id` → soft-archives draft.
- Audit helpers in `utils/audit.ts` (`logStatusChange`, `logAudit`).

### ✅ Milestone 2.5 — Client Dashboard UI
- Tabs: All · Drafts · In Review · Payment · Published · Expired · Rejected (with live counts).
- Ad form (create/edit): 4-step stepper — Details → Media (placeholder) → Package → Review.
- `AdStatusBadge`, `AdCard` (status-aware actions), `StatusTimeline` components.
- Profile page: basic info, seller profile, change password.

### ✅ Milestone 2.6 — Payment Submission
- `POST /api/client/payments` (multipart: ad_id, amount, method, transaction_ref, sender_name, optional `screenshot` file).
- Screenshot uploaded via multer, stored in `server/uploads/`, URL saved as `screenshot_url`.
- Duplicate `transaction_ref` rejected with 409 and clear error message.
- Status transition: `payment_pending → payment_submitted`; writes `AdStatusHistory` + `AuditLog`.
- `GET /api/client/payments` (paginated, filterable by ad_id) + `GET /api/client/payments/:id`.
- Zod validation via `validators/payment.validator.ts`.

**Phase 2 Acceptance:** ✅ A client can create an ad, upload images (multer → local `/uploads/`), pick a package, submit it, see it move into review, and submit payment proof with optional screenshot. All transitions write to `AdStatusHistory` and `AuditLog`.

---

## Phase 3 — Moderation, Admin Verification & Publishing (Week 3)

Goal: moderator and admin workflows make ads ready to go live; super-admin manages taxonomy, packages, and users; notifications fire on transitions.

### ✅ Milestone 3.1 — Moderator Review Workflow
- `GET /api/moderator/review-queue` with filter, sort, pagination.
- `PATCH /api/moderator/ads/:id/review` actions: `approve_content` → Payment Pending · `reject` (with reason) · `flag` (suspicious/duplicate) · `add_note`.
- Append `AdStatusHistory` + `AuditLog` on every action.
- Moderator UI: queue list, ad detail with media preview, action panel, internal notes thread.
- Backend: `controllers/moderator.controller.ts`, `routes/moderator.routes.ts`, `validators/moderator.validator.ts`.

### ✅ Milestone 3.2 — Admin Payment Verification
- `GET /api/admin/payment-queue` (payments with status = submitted).
- `PATCH /api/admin/payments/:id/verify` → verify or reject with note.
- Side panel showing ad summary + screenshot URL (local file, not S3).
- Reject path notifies client and reverts ad to Payment Pending.
- Backend: `controllers/admin.controller.ts`, `routes/admin.routes.ts`, `validators/admin.validator.ts`.

### ✅ Milestone 3.3 — Publishing & Scheduling
- `PATCH /api/admin/ads/:id/publish` with optional `publish_at`; auto-compute `expire_at = publish_at + package.duration_days`.
- `PATCH /api/admin/ads/:id/feature` (toggle featured + `admin_boost` value).
- Admin UI: publish-now / schedule-for-date, featured toggle, manual rank boost slider.
- Implemented within admin controller/routes.

### ✅ Milestone 3.4 — Admin & Super-Admin Console
- User management: list, filter by role, suspend, change role (super-admin only).
- Package management (super-admin): full CRUD + activate/deactivate.
- Category & City management with slug auto-generation (also covered in Milestone 2.3).
- Backend: `controllers/console.controller.ts`, `validators/console.validator.ts`.

### ✅ Milestone 3.5 — Notifications
- `Notification` create helpers in `services/notification.service.ts`.
- `GET /api/notifications` and `PATCH /api/notifications/:id/read`.
- Bell icon UI with unread count and dropdown list.
- Backend: `controllers/notification.controller.ts`, `routes/notification.routes.ts`.
- Email channel (AWS SES) skipped; notification service is in-app only.

**Phase 3 Acceptance:** ✅ A submitted ad can be reviewed by a moderator, paid for by a client, verified by an admin, and scheduled/published. All four roles have working dashboards. Notifications fire in-app on key transitions.

---

## Phase 4 — Public Experience, Automation, Analytics & Remaining Features

Goal: public-facing browsing with ranking, cron-driven lifecycle automation, analytics dashboard, system health viewer, and a rich frontend.

### ✅ Milestone 4.1 — Public Ad Browsing (Backend)
- `GET /api/ads` — filters: category, city, package, price range, text search (`?q=`); sort: rank/newest/price_asc/price_desc; pagination.
- `GET /api/ads/:slug` — detail; increments `view_count`; returns ad + media + status history.
- Active-status screening: `status=published AND publish_at <= now AND expire_at > now`.
- `POST /api/ads/:id/report` — auth required, logs to AuditLog.
- Primary media attached to list results.
- Backend: `controllers/public.controller.ts`, `routes/public.routes.ts`.

### ✅ Milestone 4.2 — Category, City & Landing (Backend)
- `GET /api/landing` — featured ads, recent ads, categories, packages, random question in one call.
- `GET /api/categories/:slug/ads` — paginated ads for a category.
- `GET /api/cities/:slug/ads` — paginated ads for a city.
- `GET /api/questions/random` — random learning question.

### ✅ Milestone 4.3 — Ranking Engine
- `utils/ranking.ts`: `computeRankScore = (weight×100) + featured_bonus(500) + freshness_decay + admin_boost`.
- Freshness decay: exponential with 7-day half-life, max +300 points.
- `POST /api/admin/recompute-rankings` — bulk recalculates all published/scheduled ads.
- Publish endpoint uses `computeRankScore` on ad publish.

### ✅ Milestone 4.4 — Scheduled Automation (cron jobs)
- Install `node-cron`; register jobs at boot in `server/src/jobs/`.
- **Publish-scheduled** (every hour): transition `scheduled → published` where `publish_at <= now`.
- **Expire-ads** (daily midnight): transition `published → expired` where `expire_at <= now`.
- **Expiring-soon notify** (daily): notify ad owners 48h before `expire_at`.
- **Rank recompute** (every 6h): call bulk rank update.
- **DB heartbeat** (every 5 min): write `SystemHealthLog` row.
- `POST /api/cron/run/:job` — manual trigger, protected by `CRON_SECRET` header.
- Each job writes start/end + outcome count to `AuditLog`.

### ✅ Milestone 4.5 — Analytics Dashboard (Backend)
- `GET /api/admin/analytics/summary` — KPI groups: Listings (by status), Revenue (total + by package), Moderation (approval rate, avg review time), Taxonomy (ads per category/city), Operations (cron last-run times).
- Date-range filter (`?from=&to=`).
- Frontend: summary KPI cards, bar chart revenue-by-package, donut moderation rate, horizontal bar ads-by-category, cron status cards. Uses Recharts.
- CSV export of revenue table.

### ✅ Milestone 4.6 — System Health & Audit Viewer (Backend)
- `GET /api/health/db` — Mongo ping + write-test latency.
- `GET /api/admin/audit-logs` — paginated, filterable by actor, action_type, target_type, date range.
- `GET /api/admin/status-history` — paginated ad status history with ad title + actor.
- `GET /api/admin/health-logs` — recent SystemHealthLog entries.
- Super-admin frontend pages: health log viewer, audit log viewer, status history search.

### ✅ Milestone 4.7 — Frontend Completion
- **Public:** Explore page (filter sidebar + results grid + pagination), Ad detail page (image gallery, seller info, package badge, expiry countdown, report button), Category page, City page, Landing page (hero, featured carousel, recent grid, packages strip, learning widget).
- **Client:** Ad creation stepper (Details → Media upload → Package → Review), My Ads dashboard (tabs by status), Payment submission form, Profile/seller page.
- **Moderator:** Review queue, Ad detail panel with action buttons and notes thread.
- **Admin:** Payment queue, Publish queue, Feature/boost controls, Analytics dashboard, Console (users, packages, categories, cities).
- **Shared:** Notification bell with unread count + dropdown, auth pages (login/register), 404 page.

### ⏭ Milestone 4.8 — Seed Enrichment _(partial)_
- ✅ Core seed done: 4 users, 3 packages, 8 categories, 6 cities, 10 learning questions.
- 🔲 Extended seed: 20 ads spanning all statuses, 12 payments, 5 media records per ad — for demo/testing.

### ⏭ Milestone 4.9 — Hardening _(skipped for now)_
- Rate limiting, helmet, CORS hardening, mongo-sanitize — already partially in place.
- Full review deferred until feature-complete.

### ⏭ Milestone 4.10 — Deployment _(skipped for now)_
- Deployment to Render/Railway + Vercel deferred until all features work locally.

**Phase 4 Acceptance:** All four roles have complete working UIs; public users can browse, filter, and view ads; scheduled jobs run automatically; analytics dashboard shows live data.

---

## What Remains (priority order)

| # | Milestone | Area | Status |
|---|-----------|------|--------|
| 1 | 4.4 | Cron jobs (publish, expire, notify, heartbeat) | ✅ Done |
| 2 | 4.5 | Analytics dashboard (backend aggregations + frontend) | ✅ Done |
| 3 | 4.6 | Health & audit viewer (backend + frontend) | ✅ Done |
| 4 | 4.7 | Frontend completion (all pages wired to real APIs) | ✅ Done |
| 5 | 4.8 | Extended seed data | 🔲 |
| 6 | 4.9 | Hardening | ⏭ Skip |
| 7 | 4.10 | Deployment | ⏭ Skip |

## Overall Progress

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Foundation, Auth, Schemas, Public Shell | ✅ Done |
| 2 | Client ad lifecycle, file uploads, payment submission | ✅ Done |
| 3 | Moderator, Admin, Super-admin, Notifications | ✅ Done |
| 4.1–4.3 | Public browsing, Landing, Ranking engine | ✅ Done |
| 4.4 | Cron jobs — publish, expire, notify, rank, heartbeat | ✅ Done |
| 4.5–4.6 | Analytics & Health/Audit (backend) | ✅ Done |
| 4.7 | Full frontend wired to all APIs | ✅ Done |
