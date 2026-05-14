---
name: adflow-design
description: AdFlow Pro design system — colors, typography, spacing, shadcn/ui component mapping, and mandatory loading/empty/error/success state patterns. Invoke this skill BEFORE writing or modifying any frontend code in this project. Triggers on: building React components, creating pages, choosing colors or fonts, styling forms, implementing tables/dashboards, adding loading/empty/error states, picking shadcn components, working on landing/explore/ad detail/dashboard/moderator/admin/analytics pages, reviewing UI for accessibility or visual consistency, or any UI bug fix. Use this skill anytime the task will change how a feature looks, feels, or is interacted with in AdFlow Pro.
---

# AdFlow Pro Design Skill

This skill is the entry point to AdFlow Pro's design system. The full specification lives in `docs/design.md` at the project root — **always read it before producing UI code**. This file is the short-form reminder of what the design system enforces and how to use it.

## When to Use (mandatory)

Invoke this skill whenever the task involves:

- Building or modifying any React component
- Creating any page (landing, explore, ad detail, dashboards, auth, etc.)
- Picking colors, fonts, spacing, radius, shadows
- Adding or styling forms, tables, modals, sheets, toasts
- Implementing loading, empty, error, or success states
- Choosing or installing a shadcn/ui component
- Adding icons (must be Lucide, 1.5px stroke, no emojis)
- Reviewing UI for accessibility, visual consistency, or anti-patterns
- Any UI bug fix or visual polish pass

Skip only when the task is purely backend, infrastructure, or non-visual scripting.

## How to Use

1. **Read `docs/design.md` first.** Treat it as the source of truth. Do not invent tokens.
2. **Match the page/component to a section in `docs/design.md` §10** (page-specific patterns) for layout guidance.
3. **Use shadcn/ui components per the inventory in `docs/design.md` §8.** Install with `npx shadcn@latest add <name>`. Build the eight custom composites (`StatusBadge`, `AdCard`, `EmptyState`, `ErrorState`, `StatCard`, `MediaUploader`, `StatusTimeline`, `RoleGuard`) on top.
4. **Apply tokens via CSS variables** from `docs/design.md` §14 — never raw hex inside components.
5. **For every async surface, implement all four states** from `docs/design.md` §9: loading skeleton, empty state with action, error state with recovery, success feedback.
6. **Run the accessibility checklist** (`docs/design.md` §12) and avoid the anti-patterns (`docs/design.md` §13) before declaring the work done.

## Quick Reference (do not substitute for reading `docs/design.md`)

### Identity
- **Pattern:** Marketplace / Directory
- **Style:** Trust & Authority (slate + sky, full light/dark)
- **No AI purple/pink gradients.** No emojis as icons.

### Tokens
- **Primary:** slate-900 (`#0F172A`) — headers, primary buttons.
- **Accent / CTA:** sky-700 (`#0369A1`) — "Submit", "Publish", "Pay".
- **Destructive:** `#DC2626`. **Success:** `#16A34A`. **Warning:** `#D97706`. **Info:** `#0369A1`.
- **Fonts:** Lexend (headings) + Source Sans 3 (body). Minimum body 16px on mobile.
- **Spacing:** 4pt scale. **Radius:** `--radius: 0.625rem` (10px).
- Full HSL token block ready to paste into `globals.css` is in `docs/design.md` §14.

### Ad Status Color Map (memorize this)

| Status | Variant |
|--------|---------|
| Draft | muted outline |
| Submitted / Under Review | info (soft blue) |
| Payment Pending / Submitted | warning (amber) |
| Payment Verified | success soft |
| Scheduled | info outline + clock icon |
| Published | success solid |
| Expired | muted strikethrough |
| Rejected | destructive soft |

Status always = color + icon + text. Never color alone.

### Component Rules
- One primary button per screen.
- Destructive confirms use `AlertDialog`, not toasts.
- Icon-only buttons need `aria-label`.
- Inputs need a visible `<Label>`; placeholder is not a label.
- Validate forms on blur, not on keystroke.
- Submit button: disabled + spinner + label change while submitting.

### Motion
- Animate only `transform` and `opacity`.
- `duration-base` 180ms; exit ≈ 60–70% of enter.
- Respect `prefers-reduced-motion`.
- Press feedback: `active:scale-[0.98]` on buttons.

### Mandatory States (every async surface)

| State | Rule |
|-------|------|
| Loading | Skeleton at exact final dimensions if op > 300ms. Never freeze the UI. |
| Empty | Icon + heading + 1-line body + (optional) primary action. Never blank. |
| Error | Cause statement + recovery action. Inline at the field, or `ErrorState` composite for sections. Never expose stack traces. |
| Success | Toast (4s) for confirmations; inline checkmark when staying on page; animated badge swap for status transitions. |

### Page Quick-Picks (see `docs/design.md` §10 for full specs)

- **Landing:** hero with search-bar CTA → categories grid → featured carousel → packages strip → trust badges → CTA band.
- **Explore:** sticky left filter sidebar (desktop) or bottom `Sheet` (mobile), 4-col grid on xl, removable filter chips.
- **Ad Detail:** 2/3 + 1/3 split; sticky sidebar with seller + package + expiry countdown.
- **Client Dashboard:** 4 StatCards on top, tabs by status, table on desktop / card list on mobile.
- **Moderator Queue:** two-pane (list 360px + detail). Keyboard shortcuts `A`/`R`/`F`/`J`/`K`.
- **Admin Payment Queue:** table → click row opens right `Sheet` with screenshot preview.
- **Analytics:** 4 KPI cards, then 2-col chart grid (line for trend, bar for revenue-by-package, bullet for moderation rate, horizontal bar for taxonomy).

### Pre-Delivery Checklist

- [ ] No raw hex in components (CSS vars only).
- [ ] No emojis as icons.
- [ ] Light AND dark mode tested independently.
- [ ] All four states implemented (loading, empty, error, success).
- [ ] Status badges use icon + text, not color alone.
- [ ] Focus rings visible; tab order matches visual order.
- [ ] Touch targets ≥ 44×44 px.
- [ ] `prefers-reduced-motion` respected.
- [ ] No layout-property animations.
- [ ] One primary button per screen.
- [ ] Tested at 375 / 768 / 1024 / 1440 px.

## Related Files

- `docs/design.md` — full design system specification (read every time)
- `docs/plan.md` — phased implementation plan with milestones
- `docs/Specification-document.md` — original project brief
- `.claude/skills/ui-ux-pro-max/SKILL.md` — generic UI/UX intelligence; use for tasks not covered by `docs/design.md` (chart selection, font pairings, advanced UX patterns)
