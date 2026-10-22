# ISCIz soft design system: restyle rules

The reference implementation is the finished Dashboard: `app/containers/Dashboard/Dashboard.module.scss`, `app/components/ISCIList/ISCIList.module.scss`, `app/containers/Header/Header.module.scss` and the tokens in `app/styles/_tokens.scss`. When in doubt, match what those do.

## Type
- **Font sizes:** use tokens only (`--text-xs` … `--text-2xl`). Nothing smaller than `--text-xs` (12px), and no raw rem or px font sizes.
- **No `text-transform: uppercase`** and no positive `letter-spacing` on labels, headers, badges or titles. Write the JSX text in sentence case ("Client name", "Filters", "Active"). Fix ALL-CAPS strings in JSX if they're literally typed in caps.
- **Mono (`--font-mono`) ONLY for:**
  - ISCI codes
  - 3-letter client codes
  - placement letters
  - hex color values
  - `kbd`

  Everything else is sans: counts, dates, subtitles, hints, table cells, footers, "Created …" lines. For numbers in lists and counts, use `font-variant-numeric: tabular-nums`.
- **Text roles:**
  - Page title (h1): `--text-2xl`, weight 700, letter-spacing -0.02em
  - Page subtitle: `--text-md`, `--ink-2`
  - Card/section title: `--text-lg`, weight 600, `--ink`
  - Field label: `--text-sm`, weight 500, `--ink-1`
  - Hint and help text: `--text-xs` or `--text-sm`, `--ink-2`
  - Body and table text: `--text-md`, `--ink-1` (primary values `--ink`, weight 500)
  - Muted meta: `--ink-2`. Use `--ink-3` only for placeholders and disabled.
- **Accent-colored text** uses `--accent-ink`, never `--accent`.

## Shape
- **Radii:**
  - Buttons, search boxes, chips and badges: `--radius-pill`
  - Form inputs and selects: `--radius-md`
  - Inner cards and panels: `--radius-md`
  - The main page card and the drawer: `--radius-lg`
  - Small icon buttons, swatches and avatars: `--radius-sm`
- **Inner cards** (cards inside the main page card): `--card` background, `1px solid var(--line)` border, `--radius-md`, no shadow. Hover can raise the border to `--line-strong`. Dividers inside cards are solid `--line`, not dashed.
- **Raised chips** (the active item on a track or frame): `--card` background with `--shadow-card`.

## Controls
- **Buttons:** only the globals (`btn-primary`, `btn-secondary`, `btn-text`, `btn-danger`, `btn-icon`, `btn-icon-danger`). Never restyle them locally. A local class may add layout only (width, margin).
- **Search:** 38px, pill, `--text-md`, icon 16px, `--ink-3` placeholder. Focus is an accent border plus the `--accent-ring` ring. Match Dashboard `.search`.
- **Inputs and selects:** 38px tall (textarea is auto), `--radius-md`, `1px solid var(--line)`, `--card` background, `--text-md`, `--ink`. Focus: `border-color: var(--accent)` plus `box-shadow: 0 0 0 3px var(--accent-ring)`. Error: `--danger` border.
- **Filter chips and segmented choices** (All / Active / Inactive and similar): a track like Dashboard `.density`, with a `--paper-1` background, a `--line` border, `--radius-pill` and 2px padding. Each option is a pill button with a transparent background. The active option uses the raised-chip look. Counts go inside in `--ink-2` with tabular-nums. No slide animation needed.
- **Switches (toggle tracks):** the knob moves with `transform` only, with a transition, plus `prefers-reduced-motion`. The on state is an `--accent` track.

## Status badges
Soft pills in sentence case: `--text-xs`, weight 500, `--radius-pill`, padding ~0.125rem 0.625rem, with an optional 6px dot.
- **Active / ok:** `--ok-soft` background, `--ok-ink` text
- **Warn:** `--warn-soft` background, `--warn-ink` text
- **Danger:** `--danger-soft` background, `--danger-ink` text
- **Inactive / neutral:** `--paper-2` background, `--ink-1` text

## Tables (anywhere other than the dashboard)
Match ISCIList:
- **Header row:** sentence-case headers, `--text-sm`, weight 500, `--ink-2`, `--paper-1` background
- **Rows:** `--text-md` cells, `--ink-1`, `1px solid var(--line)` row dividers, ~0.75rem vertical padding, row hover `--paper-1`
- **Codes:** mono in `--accent-ink`, weight 600

## Page shell
Pages with a sidebar plus a main area use the shared shell partial (`app/styles/_shell.scss`), which matches the Dashboard exactly:
- the sidebar sits on the frame
- the main column is the floating card
- the page head, footer and kbd follow the same rules

## Don't
- No raw hex, rgba or font-family values. Use tokens.
- Don't animate layout properties.
- Don't change `border-width`, `padding` or `font-weight` on hover or active states.
- Don't add markup unless a rule needs it.
