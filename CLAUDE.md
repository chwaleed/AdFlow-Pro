# AdFlow Pro

A moderated paid-listing marketplace where clients submit ads, moderators review content, admins verify payments, and approved ads go live for package-based durations. Built as a final-term capstone project.

## Stack

- **Frontend:** React + Vite, Tailwind CSS, shadcn/ui, Lucide icons, react-hook-form + Zod, Recharts.
- **Backend:** Node.js + Express, Mongoose.
- **Database:** MongoDB.
- **Storage:** AWS S3 (presigned uploads for ad media and payment screenshots).
- **Auth:** JWT (access + refresh).
- **Validation:** Zod (shared between client and server).
- **Jobs:** node-cron / Agenda for publish, expire, notify, and DB heartbeat.

## Reference Documents (load before working on the project)

| File | Purpose |
|------|---------|
| `docs/Specification-document.md` | Original project brief — roles, modules, lifecycle, suggested DB and APIs |
| `docs/plan.md` | Phased implementation plan (4 weekly phases, milestones, modules) |
| `docs/design.md` | **Authoritative design system** — colors, typography, spacing, shadcn components, mandatory state patterns |

## How to Work in This Project

### When writing or modifying UI

1. **Always invoke the `adflow-design` skill first** (`.claude/skills/adflow-design/SKILL.md`). It points to `docs/design.md` and summarizes the non-negotiable rules.
2. Use shadcn/ui components from the inventory in `docs/design.md` §8. Run `npx shadcn@latest add <name>` to install them.
3. Tokens come from CSS variables (`docs/design.md` §14) — never raw hex values in components.
4. Every async surface must implement loading + empty + error + success states (`docs/design.md` §9). No blank screens, no silent failures.
5. Style is **Trust & Authority** (slate + sky, professional). Avoid AI purple/pink gradients and emojis-as-icons.

### When writing backend or API code

1. Consult `docs/plan.md` to see which phase/milestone the work belongs to.
2. Follow the data model in `docs/Specification-document.md` §10 and the suggested API surface in §11.
3. Every status transition writes to `AdStatusHistory` and `AuditLog`.
4. Validate inputs with Zod at the API boundary; trust internal callers.
5. S3 access is via presigned URLs (`POST /api/media/presign` → client uploads → `POST /api/media/confirm`). Never proxy uploads through the server.

### When designing schedules or automation

- Use cron jobs per `docs/plan.md` Milestone 4.4. Each job is idempotent and writes its outcome to `AuditLog`.
- Manual-trigger endpoints (`POST /api/cron/*`) are gated by a shared secret.

## Project Conventions

- Folder layout: `/server` (Express + Mongoose) and `/client` (React + Vite) — see `docs/plan.md` "Suggested Folder Structure".
- Response envelope: `{ ok: boolean, data?, error? }`.
- Slugs are unique with collision suffix.
- Transaction references are unique (sparse index) — duplicates are blocked with a clear error.
- Audit trail is non-negotiable: status transition, payment verification, and admin action all log to `AuditLog` + `AdStatusHistory`.

## Skills Available in This Project

- **`adflow-design`** — AdFlow-specific design system. Auto-trigger on any UI task in this project.
- **`ui-ux-pro-max`** — generic UI/UX intelligence (161 color palettes, 57 font pairings, 25 chart types). Use only when a question is outside `design.md`'s scope (e.g., advanced chart selection or alternative font pairings).

Prefer `adflow-design` first; fall back to `ui-ux-pro-max` only when the answer isn't already in `docs/design.md`.
