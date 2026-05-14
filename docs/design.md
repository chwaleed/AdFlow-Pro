# AdFlow Pro — Design System

**Pattern:** Marketplace / Directory
**Style:** Trust & Authority (professional navy + blue CTA; full light + dark mode)
**UI Library:** shadcn/ui (Radix primitives + Tailwind tokens)
**Icons:** Lucide React (consistent stroke width: 1.5px)
**Fonts:** Lexend (headings) · Source Sans 3 (body)

Source of truth: this file. Page-level deviations live in `design-system/pages/*.md` if needed; otherwise everything here applies.

---

## 1. Design Principles

1. **Trust over flash.** This is a paid-listing marketplace with moderation and payment verification — visual language must read as credible and accountable, not "AI startup playful."
2. **State clarity.** Every ad has a lifecycle (Draft → Submitted → Under Review → Payment Pending → Payment Verified → Scheduled → Published → Expired). The UI must always make the current state and next action obvious.
3. **Role-aware density.** Public pages are airy and scannable; moderator/admin dashboards are dense, table-driven, and information-rich.
4. **No surprises.** Every async action has a loading state. Every empty list has a guidance message. Every error has a recovery path.
5. **One primary action per screen.** Secondary actions are visually subordinate. Destructive actions are visually separated.

---

## 2. Color System

Use semantic tokens everywhere. **Never use raw hex values inside components** — go through CSS variables. The names below match shadcn/ui's variable scheme so you can drop them straight into `app/globals.css`.

### 2.1 Brand & Functional Tokens

| Role | Light Hex | Dark Hex | CSS var | Usage |
|------|-----------|----------|---------|-------|
| Primary | `#0F172A` (slate-900) | `#F8FAFC` (slate-50) | `--primary` | Headers, primary buttons, nav active state |
| Primary Foreground | `#FFFFFF` | `#0F172A` | `--primary-foreground` | Text on primary surfaces |
| Secondary | `#334155` (slate-700) | `#CBD5E1` (slate-300) | `--secondary` | Secondary buttons, subtle headings |
| Secondary Foreground | `#FFFFFF` | `#0F172A` | `--secondary-foreground` | |
| Accent / CTA | `#0369A1` (sky-700) | `#38BDF8` (sky-400) | `--accent` | Primary CTAs ("Submit", "Publish", "Pay") |
| Accent Foreground | `#FFFFFF` | `#0C1116` | `--accent-foreground` | |
| Background | `#F8FAFC` | `#020617` | `--background` | App background |
| Foreground | `#020617` | `#F8FAFC` | `--foreground` | Body text |
| Card | `#FFFFFF` | `#0B1220` | `--card` | Cards, modals, sheets |
| Card Foreground | `#020617` | `#F8FAFC` | `--card-foreground` | |
| Muted | `#E8ECF1` | `#1E293B` | `--muted` | Subtle backgrounds (table headers, filter chips) |
| Muted Foreground | `#64748B` | `#94A3B8` | `--muted-foreground` | Helper text, timestamps, metadata |
| Border | `#E2E8F0` | `#1F2937` | `--border` | Dividers, input borders |
| Input | `#E2E8F0` | `#1F2937` | `--input` | Form field borders |
| Ring | `#0369A1` | `#38BDF8` | `--ring` | Focus rings (2–3px) |
| Destructive | `#DC2626` | `#F87171` | `--destructive` | Reject, delete, expired |
| Destructive Foreground | `#FFFFFF` | `#1A0A0A` | `--destructive-foreground` | |
| Success | `#16A34A` | `#4ADE80` | `--success` | Published, payment verified |
| Warning | `#D97706` | `#FBBF24` | `--warning` | Payment pending, expiring soon |
| Info | `#0369A1` | `#38BDF8` | `--info` | Under review, scheduled |

### 2.2 Ad Status Color Map

Every status badge uses the same mapping so users learn the visual language once:

| Status | Token | Badge style |
|--------|-------|-------------|
| Draft | `muted` | grey outline |
| Submitted | `info` (10% bg, 100% text) | soft blue |
| Under Review | `info` | soft blue |
| Payment Pending | `warning` | soft amber |
| Payment Submitted | `warning` | soft amber, animated pulse |
| Payment Verified | `success` (10% bg) | soft green |
| Scheduled | `info` (outline) | blue outline with clock icon |
| Published | `success` solid | green filled |
| Expired | `muted` strikethrough | grey, reduced opacity |
| Rejected | `destructive` | soft red |

### 2.3 Contrast Requirements

- Body text on background: **≥ 4.5:1** (AA). Verified pairs:
  - `foreground` on `background` (light): 19.4:1 ✓
  - `muted-foreground` on `background` (light): 4.7:1 ✓
  - `accent-foreground` on `accent`: 7.1:1 ✓
- Functional colors (destructive/success/warning) never carry meaning alone — always pair with an icon and/or text label.
- Dark mode is **designed independently**, not inverted. Test contrasts separately.

---

## 3. Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap');

:root {
  --font-heading: 'Lexend', system-ui, sans-serif;
  --font-body: 'Source Sans 3', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace; /* for transaction refs, IDs */
}
```

### 3.1 Type Scale (rem)

| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| `text-display` | 3.5rem (56px) | 1.05 | 700 | Landing hero only |
| `text-h1` | 2.25rem (36px) | 1.15 | 600 | Page titles |
| `text-h2` | 1.75rem (28px) | 1.2 | 600 | Section headings |
| `text-h3` | 1.375rem (22px) | 1.3 | 600 | Card titles, modal titles |
| `text-h4` | 1.125rem (18px) | 1.4 | 600 | Subsection titles, ad titles in cards |
| `text-body` | 1rem (16px) | 1.6 | 400 | Default body (minimum for mobile) |
| `text-sm` | 0.875rem (14px) | 1.5 | 400 | Helper text, table cells |
| `text-xs` | 0.75rem (12px) | 1.4 | 500 | Badges, timestamps, eyebrow labels |
| `text-mono` | 0.875rem | 1.4 | 500 | Transaction refs, ad IDs, JSON in dev tools |

### 3.2 Rules

- Body text is **never** below 16px on mobile (prevents iOS auto-zoom).
- Line length: 60–75 characters for paragraphs (use `max-w-prose` in Tailwind).
- Numeric data (prices, view counts, dates in tables) uses `font-variant-numeric: tabular-nums` to prevent column jitter.
- No weight below 400 for body. No italic for emphasis (use weight 600 instead).
- Headings use Lexend; **never** mix Lexend at body sizes — body is always Source Sans 3.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (4pt base, Tailwind default)

`0 · 1 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24` → `0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` px.

| Token | px | Use |
|-------|----|----|
| `space-1` | 4 | icon-text gap |
| `space-2` | 8 | small inline gaps |
| `space-3` | 12 | form field internal padding |
| `space-4` | 16 | default card padding (mobile) |
| `space-6` | 24 | card padding (desktop), section-internal gaps |
| `space-8` | 32 | between cards in a list |
| `space-12` | 48 | between page sections (mobile) |
| `space-16` | 64 | between page sections (desktop) |
| `space-24` | 96 | landing-page hero/section breathing room |

### 4.2 Breakpoints

| Name | Min width | Targets |
|------|-----------|---------|
| `sm` | 640 | large phone |
| `md` | 768 | tablet portrait |
| `lg` | 1024 | tablet landscape / small laptop |
| `xl` | 1280 | desktop |
| `2xl` | 1536 | large desktop |

Design mobile-first (375px reference) → scale up.

### 4.3 Containers

| Page type | Max width |
|-----------|-----------|
| Marketing / landing / static | `max-w-7xl` (1280px) |
| Explore / category / city listings | `max-w-7xl` |
| Ad detail | `max-w-5xl` (split 2/3 + 1/3) |
| Client dashboard | `max-w-6xl` |
| Moderator / admin dashboards | `max-w-screen-2xl` (full-bleed tables) |
| Forms (single column) | `max-w-2xl` |

Horizontal page gutter: `px-4` mobile, `px-6` tablet, `px-8` desktop.

### 4.4 Grid Patterns

- Public ad grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` with `gap-6`.
- Dashboard summary cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Form layouts: single column on mobile, two-column (`grid-cols-1 md:grid-cols-2`) for related fields only (e.g., city + category).

---

## 5. Elevation, Radius & Borders

### 5.1 Radius

| Token | px | Use |
|-------|----|----|
| `radius-sm` | 6 | inputs, small buttons, badges |
| `radius-md` | 10 | cards, default buttons, dropdown items |
| `radius-lg` | 14 | modals, large cards, ad cards |
| `radius-xl` | 20 | hero feature cards, featured ad highlights |
| `radius-full` | 9999 | avatars, status dots, pill filters |

shadcn default: set `--radius: 0.625rem` (10px).

### 5.2 Shadows (light mode)

| Token | Definition | Use |
|-------|------------|-----|
| `shadow-xs` | `0 1px 2px rgb(15 23 42 / 0.04)` | Input focus halo |
| `shadow-sm` | `0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)` | Resting cards |
| `shadow-md` | `0 4px 12px rgb(15 23 42 / 0.08)` | Hovered cards, dropdowns |
| `shadow-lg` | `0 12px 32px rgb(15 23 42 / 0.12)` | Modals, popovers |
| `shadow-focus` | `0 0 0 3px rgb(3 105 161 / 0.35)` | Focus ring offset |

Dark mode: shadows are nearly invisible; instead use **borders + a subtle lighter card background** (`--card` is one shade lighter than `--background`) to convey elevation.

### 5.3 Borders

- Default: 1px solid `var(--border)`.
- Active/focused inputs: 1px solid `var(--ring)` + `shadow-focus`.
- Destructive state inputs: 1px solid `var(--destructive)` + soft red bg tint (`destructive/5%`).

---

## 6. Iconography

- **Library:** `lucide-react`. Never use emojis as structural icons.
- **Sizes:** `icon-sm` 16px, `icon-md` 20px (default in buttons/nav), `icon-lg` 24px (page headers), `icon-xl` 32px (empty states).
- **Stroke width:** 1.5px (Lucide default 2 looks heavy with Lexend; override to 1.5 globally).
- **Color:** inherits `currentColor`; pair with `text-muted-foreground` for decorative use, `text-foreground` for emphasis.
- **Filled vs outline:** outline only across the product, except for `Star` (featured) and active nav indicators where filled is allowed.

---

## 7. Motion

### 7.1 Duration & Easing

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast` | 120ms | tooltip in/out, hover color |
| `duration-base` | 180ms | button press, dropdown reveal |
| `duration-slow` | 260ms | modal open, sheet slide |
| `duration-page` | 320ms | page transition fade |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | enter |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | exit |

### 7.2 Rules

- Only animate `transform` and `opacity` — never `width`, `height`, `top`, `left`.
- Exit animations are 60–70% of enter duration.
- Respect `prefers-reduced-motion: reduce` — disable all non-essential animation; preserve opacity fades for state feedback.
- Skeleton shimmer: `2s` linear infinite, 30% opacity range.
- Press feedback: `active:scale-[0.98]` on buttons; `active:scale-[0.995]` on cards.
- No more than 2 elements animating per view at a time.

---

## 8. Component Inventory (shadcn/ui)

Install only what's needed; map each to AdFlow use cases.

| shadcn component | AdFlow use |
|------------------|------------|
| `Button` | All CTAs. Variants: `default` (primary), `secondary`, `outline`, `ghost`, `destructive`, `link` |
| `Input`, `Textarea`, `Label` | Ad form, payment form, auth |
| `Select`, `Combobox` | Category, city, package pickers |
| `RadioGroup`, `Checkbox`, `Switch` | Package selector, featured toggle, notification prefs |
| `Form` (react-hook-form + zod) | All forms |
| `Card`, `CardHeader/Content/Footer` | Ad cards, dashboard summary cards, package cards |
| `Badge` | Status badges (driven by the status color map in §2.2) |
| `Tabs` | Client dashboard sections, ad detail (overview / payment / history) |
| `Dialog`, `AlertDialog` | Confirm destructive actions, ad preview |
| `Sheet` | Mobile filters drawer, moderator action panel |
| `DropdownMenu` | Row actions in tables (publish, feature, archive) |
| `Tooltip` | Icon-only button labels, truncated text expansion |
| `Toast` (`sonner`) | Success/error feedback after mutations |
| `Skeleton` | Loading placeholders (see §9.1) |
| `Avatar` | Seller avatar, moderator/admin identity in audit logs |
| `Pagination` | Explore page, all admin tables |
| `Table` (TanStack Table on top) | Moderation queue, payment queue, user management |
| `Progress` | Multi-step ad submission, payment verification progress |
| `Calendar`, `Popover` | Publish date picker, analytics date range |
| `Separator` | Section dividers inside cards |
| `ScrollArea` | Long lists in side panels |
| `Carousel` (embla) | Featured ads on landing, image gallery on ad detail |
| `Sonner` toaster | Top-right, `aria-live="polite"`, max 3 stacked, auto-dismiss 4s |

### 8.1 Custom Composites (to build on top of shadcn)

- `StatusBadge` — wraps `Badge` and resolves status → variant + icon automatically.
- `AdCard` — image (S3 thumb with placeholder fallback), title, price, status badge, package badge, expiry chip.
- `EmptyState` — icon + heading + body + optional primary action (see §9.2).
- `ErrorState` — icon + heading + body + retry action (see §9.3).
- `StatCard` — KPI label + big number + delta indicator (used in analytics).
- `MediaUploader` — drag-drop + S3 presigned upload + thumbnail preview + validation messaging.
- `StatusTimeline` — vertical timeline from `AdStatusHistory` (used on ad detail and dashboard).
- `RoleGuard` — wraps routed pages; redirects unauthorized roles.

---

## 9. State Patterns

These are mandatory. Every async-driven surface must implement all four states: **loading, empty, error, success**.

### 9.1 Loading States

**Rule:** Show feedback within 100ms; if operation > 300ms, render a skeleton, never a frozen page.

**Patterns by surface:**

| Surface | Pattern |
|---------|---------|
| Ad grid (explore) | 8 `Skeleton` cards in the grid (image + 2 text bars + badge bar). Matches final card dimensions exactly. |
| Ad detail page | Skeleton for image (16:9), 2 lines for title, 4 lines for description, side card skeleton. |
| Tables (moderation, payment, users) | 5 skeleton rows of matching height; column headers visible immediately. |
| Forms during submission | Submit button → `disabled` + spinner icon + label changes ("Submit" → "Submitting…"). Inputs remain readable but locked. |
| Mutations (approve, reject, publish) | Optimistic toast `"Approving…"` → resolves to success/error toast. Row in table dims to 60% opacity until resolved. |
| Image loading (S3 thumbs) | Placeholder gradient at correct aspect ratio (declare `width`/`height` to prevent CLS); fade in on load. |
| Charts | `Skeleton` placeholder at exact chart dimensions; never show an empty axis frame. |
| Auth check (route guard) | Full-page centered spinner only if check exceeds 200ms; otherwise show content immediately. |

**Skeleton component spec:**
```tsx
<div className="animate-pulse bg-muted rounded-md" style={{ width, height }} />
```
Use `aria-busy="true"` on the parent container. Shimmer is purely visual; do not delay screen reader content.

### 9.2 Empty States

**Rule:** Never show a blank screen. Every empty list/grid/table must have: **icon → heading → 1-line explanation → primary action (when applicable)**.

| Context | Icon | Heading | Body | Action |
|---------|------|---------|------|--------|
| Client dashboard, no ads yet | `Megaphone` | "Post your first ad" | "Create a listing in under 2 minutes and reach buyers in your city." | `[ Create ad ]` (primary) |
| Client dashboard, no rejected ads | `CheckCircle2` (muted) | "Nothing rejected" | "Your ads are all in good standing." | none |
| Moderator queue, empty | `Coffee` | "Inbox zero" | "No ads waiting for review right now." | `[ View recently approved ]` (ghost) |
| Admin payment queue, empty | `Wallet` | "All caught up" | "No payments pending verification." | none |
| Explore, filters return nothing | `SearchX` | "No ads match these filters" | "Try removing a filter or browsing a different category." | `[ Clear filters ]` (outline) |
| Search, empty query result | `Search` | "No results for `{query}`" | "Check spelling or try a more general term." | `[ Browse all ]` (link) |
| Analytics, no data for range | `BarChart3` | "No activity in this range" | "Try a wider date range to see results." | `[ Last 30 days ]` (outline) |
| Notifications, empty | `BellOff` | "You're all caught up" | "We'll let you know when something needs your attention." | none |

**Layout:** centered, vertical, max-width `max-w-sm`, top padding `py-16` minimum so it doesn't feel cramped. Icon at `icon-xl` (32px) with `text-muted-foreground`.

### 9.3 Error States

**Rule:** Every error has a cause statement + recovery action. Errors live as close to the source as possible.

**Inline (field-level):**
- Red 1px border on input + `destructive/5` background tint.
- Error message **below** the field, prefixed with `AlertCircle` icon at 14px, `text-sm text-destructive`.
- `aria-invalid="true"` + `aria-describedby` pointing to the error message id.
- On submit with multiple errors: scroll/focus to the first invalid field and announce via `role="alert"`.

**Section-level (e.g., "couldn't load review queue"):**
- Use the `ErrorState` composite: `AlertTriangle` icon, heading "Couldn't load [thing]", body shows the user-safe error message, primary action `[ Try again ]`, secondary action `[ Go to dashboard ]`.
- Never expose stack traces. Log full error to console + monitoring.

**Toast errors (mutation failures):**
- Use `sonner` `toast.error()`. Title: short verb-phrase ("Couldn't approve ad"). Description: one sentence on the cause + recovery. Auto-dismiss disabled when an action is offered.

**Page-level (404, 500, network down):**
- Full centered layout, same `ErrorState` composite at larger size.
- 404: `Compass` icon, "Page not found", `[ Go home ]`.
- 500: `ServerCrash` icon, "Something went wrong on our end", `[ Try again ]` + `[ Contact support ]`.
- Offline: `WifiOff` icon, "You're offline", `[ Retry ]` (with auto-retry on `navigator.onLine` event).

**Specific recipes:**
| Scenario | Message | Recovery |
|----------|---------|----------|
| Duplicate `transaction_ref` | "This transaction reference has already been submitted." | `[ Use a different reference ]` (focuses field) |
| S3 upload failed | "Couldn't upload `{filename}`. Check your connection and try again." | `[ Retry upload ]` |
| External media URL invalid | "We couldn't verify this image URL." | `[ Use a different URL ]` + helper text listing allowed sources |
| Payment screenshot too large | "Screenshot must be under 5 MB." | none, blocks submit until corrected |
| Permission denied | "You don't have access to this page." | `[ Back to dashboard ]` |

### 9.4 Success Feedback

- **Toasts** for non-destructive confirmations ("Ad submitted for review", "Payment verified") — auto-dismiss 4s, top-right.
- **Inline checkmark + green text** after form submit when staying on the page.
- **Status transitions** in dashboards: animated badge swap (180ms color crossfade) so the user can see the change without a page reload.
- **Confetti only on first ad published** — once per user — using `canvas-confetti`, respecting reduced-motion (skip entirely).

### 9.5 Disabled States

- Opacity `0.4–0.5` + `cursor: not-allowed` + actual `disabled` attribute (no fake-disabled buttons that swallow clicks silently).
- Tooltip on hover explaining **why** it's disabled (e.g., "Pay for the ad before publishing").

---

## 10. Page-Specific Patterns

### 10.1 Landing Page (Marketplace pattern)

Section order from the skill recommendation:
1. **Hero** — search-bar centric. Headline (`text-display`), one-line value prop, search input dominant (`h-14`, full-width on mobile, max-w-2xl on desktop). Background: subtle slate gradient, no AI purple/pink.
2. **Categories grid** — 6–8 cards with Lucide icons. Hover lifts to `shadow-md`.
3. **Featured ads carousel** — embla carousel of 8 featured ads.
4. **Packages strip** — 3 package cards side-by-side (Basic/Standard/Premium). Middle one marked "Most popular" with accent border.
5. **Trust badges** — moderation guarantee, payment verification, expiry guarantee. Plain icons + short copy.
6. **CTA band** — "List your item" → register flow.

### 10.2 Explore / Ad Listings

- Sticky left filter sidebar on desktop (collapsible). On mobile: filter button opens `Sheet` from the bottom.
- Results: 4-column grid on `xl`, 3 on `lg`, 2 on `sm`, 1 on mobile.
- Sort dropdown: Newest · Rank · Price ↑ · Price ↓.
- Pagination at bottom (shadcn `Pagination`).
- Active filters appear as removable chips above results.

### 10.3 Ad Detail

- Split layout: 2/3 (media gallery + description + status timeline) and 1/3 sticky sidebar (seller card + package badge + expiry countdown + contact/report buttons).
- Image gallery: main image with thumbnail strip; supports keyboard arrow nav.
- Report button low-emphasis (ghost) but always visible.

### 10.4 Client Dashboard

- Top: 4 `StatCard`s (Active · Under Review · Payment Pending · Expired).
- Tabs for filters: All · Drafts · Review · Pending Payment · Published · Expired · Rejected.
- Table on desktop, card list on mobile. Each row: thumbnail, title, status badge, package badge, expiry date, kebab menu (Edit · View · Withdraw).

### 10.5 Moderator Queue

- Two-pane layout on desktop: list (left, 360px) and detail (right, fills remaining width). On mobile: stacked, full-screen detail with back button.
- Detail pane: ad preview at top, action panel sticky at bottom (Approve · Reject · Flag · Add note).
- Reject opens a `Dialog` requiring a reason (radio list of common reasons + free-text "other").
- Keyboard shortcuts: `A` approve, `R` reject, `F` flag, `J/K` next/prev (display hint).

### 10.6 Admin Payment Queue

- Table with columns: Ad title · Client · Amount · Method · Transaction ref · Submitted · [Verify].
- Click row → `Sheet` slides in from right with screenshot preview, ad summary, and verify/reject buttons.
- Verify is the **only primary button**; reject is `destructive` variant.

### 10.7 Analytics Dashboard

Layout: 4 KPI `StatCard`s on top, then a 2-column chart grid.
- Revenue trend → **Line chart** (Recharts), accent color, 1.5px stroke, area fill at 15% opacity.
- Revenue by package → **Bar chart**, primary color.
- Moderation approval rate → **Bullet chart** (or stacked bar), green/red ranges.
- Ads by category → **Horizontal bar chart**, max 8 bars (group long tail as "Other").
- Cron health → **Status cards** (last run, success/fail, duration).

All charts follow accessibility rules: tabular tooltips, axis labels with units, color + pattern (dashed/dotted) for multi-series, screen-reader summary, "no data" empty state with date-range action, CSV export button.

### 10.8 System Health & Audit

Plain dense tables, monospace for IDs and transaction refs, tabular numerics. Server-side filtering. Color used sparingly: only for status pills.

---

## 11. Forms (used everywhere — ad submit, payment, auth, admin)

- **Label above input.** Required marker: `*` in `text-destructive` after the label.
- **Helper text** in `text-sm text-muted-foreground` below the input, persistent (not placeholder).
- **Placeholder** is example data only ("e.g., 2-bedroom apartment near…"), not a label substitute.
- **Validate on blur**, not on every keystroke. Show error only after the user has had a chance to finish.
- **Inline error** below field with icon and message.
- **Submit button** anchored bottom-right of the form on desktop; full-width on mobile.
- **Multi-step ad submission** uses a `Progress` component with step labels (Details · Media · Package · Review).
- **Auto-save drafts** every 10s for the ad form; toast "Draft saved" silently on each save (use `sonner` `duration: 1500`, position bottom-left, low-emphasis).
- **Destructive confirms** use `AlertDialog`, never inline. The confirm button is `destructive` variant; cancel is the default-focused button.

---

## 12. Accessibility Checklist (must pass before any PR ships)

- [ ] All text contrast meets 4.5:1 (body) and 3:1 (large/heading) — verified in both light and dark mode.
- [ ] All icon-only buttons have `aria-label`.
- [ ] All form inputs have a visible `<Label>` (placeholder-only is never sufficient).
- [ ] Errors use `role="alert"` or `aria-live="polite"` so screen readers announce them.
- [ ] Tab order matches visual order; focus is always visible (use `--ring`).
- [ ] No information conveyed by color alone — pair status colors with icons/text.
- [ ] All interactive elements are ≥ 44×44 px touch target on mobile (use `hitSlop` or padding).
- [ ] `prefers-reduced-motion` respected on every animation.
- [ ] Modals trap focus and restore to trigger on close. Escape closes them.
- [ ] Skip-to-content link on every public page.
- [ ] Heading hierarchy is sequential (no skipped levels).

---

## 13. Anti-Patterns (do not ship)

- AI purple/pink gradients — clashes with the Trust & Authority style. Use slate + sky only.
- Emojis as functional icons. Lucide only.
- Status conveyed by color alone (must always have icon + text).
- Modals for navigation (use routed pages).
- Animating layout properties (`width`, `top`) — only `transform` and `opacity`.
- More than one primary button per screen.
- Toasts for destructive confirms (use `AlertDialog`).
- Truncated text without tooltip or expand.
- Tables without sticky headers when scrolling.
- Empty states that say only "No data" with no guidance or action.

---

## 14. Token Reference (drop-in for `app/globals.css`)

```css
@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 4%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 4%;
    --primary: 222 47% 11%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 25% 27%;
    --secondary-foreground: 0 0% 100%;
    --accent: 201 96% 32%;
    --accent-foreground: 0 0% 100%;
    --muted: 214 25% 92%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 201 96% 32%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 71% 37%;
    --warning: 32 95% 44%;
    --info: 201 96% 32%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 222 47% 3%;
    --foreground: 210 40% 98%;
    --card: 222 35% 8%;
    --card-foreground: 210 40% 98%;
    --popover: 222 35% 8%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222 47% 11%;
    --secondary: 215 20% 75%;
    --secondary-foreground: 222 47% 11%;
    --accent: 199 89% 60%;
    --accent-foreground: 222 47% 4%;
    --muted: 217 19% 18%;
    --muted-foreground: 215 16% 65%;
    --border: 217 19% 18%;
    --input: 217 19% 18%;
    --ring: 199 89% 60%;
    --destructive: 0 84% 70%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 70% 60%;
    --warning: 38 92% 58%;
    --info: 199 89% 60%;
  }
}
```

Tailwind config maps these to semantic class names (`bg-background`, `text-foreground`, `border-border`, etc.) the standard shadcn way — install shadcn with `npx shadcn@latest init` and the variable system is wired automatically.
