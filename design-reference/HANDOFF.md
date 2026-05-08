# ISCIz — Design Handoff

This doc is written for Claude Code working on the existing ISCIz prototype. It compares the **current prototype** (screenshots provided) to the **new design** (`option-a.html`, `admin.html` in this project) and lists the changes to apply.

**Goal:** surgical changes, not a rewrite. Keep all existing backend, auth, DB schema, and routing. Update the UI only where called out below.

---

## Files to reference in this project

- `option-a.html` — full Dashboard + Detail (read-only) + Edit + Create flows (React + inline JSX)
- `admin.html` — Admin with Clients / Agencies / Users sub-sections (React + inline JSX)
- `shared/theme.css` — design tokens (CSS variables for colors, spacing, type, shadows)
- `shared/data.js` — mock data shape; use as reference for UI-expected fields only, not as a schema

Open both HTML files in a browser to see interactions (search, Cmd-K, drawers, validation, etc.) before starting.

---

## Design tokens — apply globally

Copy the `:root` and `.theme-light` blocks from `shared/theme.css` into the app's global stylesheet. Key tokens:

- Accent: `--accent: #F5A623` (orange) — replaces the existing gold `#FBBF24`-ish buttons
- Background scale: `--bg-0 #0B0D10` → `--bg-1 #14171C` → `--bg-2 #1B1F26` → `--bg-3 #222732`
- Text: `--fg-0 #EAECEF`, `--fg-1 #B7BDC7`, `--fg-2 #7A828E`
- Radius: 10/12/16 px; Shadow: `--shadow-1` for cards, `--shadow-2` for drawers
- Font: Inter for UI, JetBrains Mono for ISCI codes

Light theme is supported — toggle adds `.theme-light` to `<html>`, persisted in `localStorage['isciz-theme']`.

---

## DASHBOARD — changes vs current

Current dashboard (screenshot `10.56.09`): search bar + table + Recently Viewed / Recently Created cards below.

### REMOVE
- Nothing from the dashboard table structure — it's close to right.

### ADD
- **Cmd-K / Ctrl-K palette** — global fuzzy search across all ISCI codes, clients, campaigns, spot titles. Opens a centered modal. See `CmdK` component in `option-a.html`. Persist recent searches in `localStorage['isciz-recent-searches']`.
- **Density toggle** — "Comfy" / "Compact" segmented control in the dashboard toolbar. Stored in `localStorage['isciz-density']`. Compact reduces row padding and font size.
- **Row click → Detail view** (read-only). Currently every row goes to Edit; that's wrong — most views are read-only. Edit becomes a button inside Detail.
- **Client color dot** in the Client column — small 8px circle, color from the client record. Makes scanning the table much faster.
- **Fuzzy search** in the main search bar (not just substring). See `matchScore()` in `option-a.html`.
- **Keyboard nav** — `↑` `↓` to move selection, `Enter` to open, `E` to edit, `N` to create new.

### CHANGE
- "+ New ISCI Code" button → keep, same position, same color (now `--accent`).
- Recently Viewed / Recently Created — keep both, but render as two equal cards side-by-side with client color dot + ISCI code + spot title. Limit to 5 each.

### KEEP
- Overall layout (topbar, page title, search, table, side cards).
- Existing backend fetch for ISCI list.

---

## DETAIL (read-only) — NEW screen

Does not exist in current prototype. Add it.

Route: `/isci/:code` → read-only Detail. Edit button in top-right navigates to `/isci/:code/edit`.

Layout: same card structure as Edit (Basic Details, Demographics, Spot Details, Audio Info, Technical Details, Slate Preview, History) but fields rendered as static text, not inputs. See the `Detail` component in `option-a.html`.

---

## EDIT — changes vs current

Current edit screen (screenshot `10.56.29`): already has the right sections. Minor changes only.

### REMOVE
- **Status field** — does not exist on the screenshot (good), make sure it doesn't exist anywhere else either. We decided statuses are not part of the model.

### CHANGE
- **Client field** — once the record has been saved AND an ISCI code has been generated from it, the **Client** and **ISCI Code** fields lock (read-only with a lock icon + tooltip "Changing the client would break the code pattern"). Still editable on a new unsaved record.
- **TBD checkbox** for Air/Start Date — when checked, date input disables and value saves as `null`. Currently unclear if this works.
- **Agency dropdown** — show "(Default)" suffix next to the default agency. Pulled from Admin → Agencies.
- **Audio Info** section — keep all 4 fields (Language, Accessibility, Audio, and add **Music Rights** if not already there — Licensed / Original / None).
- **Spot Length** — seconds input as a free integer, not a dropdown. Currently a dropdown; users need arbitrary values.

### KEEP
- Slate Preview + Export as JPG.
- History panel.
- Save / Cancel buttons top-right.

---

## CREATE NEW — changes vs current

Same form as Edit, but:
- **ISCI Code** field is auto-generated and read-only — shows the preview as the user fills in Client + year + sequence. Format: `{CODE}{YY}{NN}` (e.g. `ADID2601`). Auto-increments the `NN` part per client per year.
- **Client** is editable here (locks only after save).
- Button reads "Create ISCI" not "Update ISCI".

See `Create` component in `option-a.html`.

---

## ADMIN — major restructure

Current admin (screenshot `11.05.40`): single page with top-of-page tabs (Client Management / Agency Management / User Management) + one big table per tab with inline Edit/Deactivate/Delete buttons.

### CHANGE
**Replace the tab layout with a sidebar sub-nav.** Sidebar on the left (240px) with:
- Clients
- Agencies
- Users

Active item has an orange accent rail on the left. See `admin.html` → `AdminShell` component.

Persist active section in `localStorage['isciz-admin-tab']`.

### Clients section — REPLACE TABLE WITH CARD GRID

Current: table with Name / Abbreviation / Code / Status / Created / Actions.

New: responsive grid of client cards (~320px wide). Each card shows:
- Color dot + client name
- 4-letter code in mono font
- ISCI count (e.g. "23 ISCIs")
- Active toggle
- Edit button

Click card → drawer slides in from right with full edit form.

**Critical rule:** The 4-letter **code locks** the moment any ISCI references the client. Show a yellow warning banner in the drawer explaining why. Name and active status stay editable. See `ClientDrawer` in `admin.html`.

**Remove the "Abbreviation" column** — it's unused.
**Remove "Delete"** as a destructive button — replace with "Deactivate" (soft delete via `active: false`). A client with ISCIs referencing it cannot be hard-deleted, ever.

### Agencies section — REPLACE TABLE WITH CARD GRID

Same pattern as Clients. Each card shows agency name + star icon if default.

**Default agency invariant:** Exactly one agency is always default. Setting agency X as default auto-unsets the current default. Cannot deactivate/delete the default — must promote another first. See `AgencyDrawer` in `admin.html`.

### Users section — KEEP TABLE

Table is the right format here. Changes:

- **Columns:** Avatar + Name / Email / Role / Last Active / Status / Actions
- **Sortable** on every column (click header → toggle asc/desc, arrow indicator)
- **Role filter** — segmented control: All / Admin / Editor
- **Search** across name + email
- **Role values:** `Admin` | `Editor` only. No Viewer, no custom roles.
- **"Add User" button** opens a drawer (NOT invite — we decided no email flow). Form: name, email (with live validation), role, active toggle. "Add user" button saves immediately.
- **Active toggle** in row — deactivated users can't sign in but are retained in the table (grayed out).
- **No hard delete** for users. Deactivate only.

See `UsersTable` and `UserDrawer` in `admin.html`.

---

## REPORTS — no change

Current Reports screen (screenshot `11.17.48`) is fine. Do not touch it in this pass. We'll revisit.

---

## TOPBAR / NAV — minor

- Logo + "ISCIz alpha" wordmark — keep as-is.
- Nav: Dashboard / Reports / Admin — keep. Orange underline on active item (already correct).
- User menu top-right — keep.
- Add a **theme toggle** (sun/moon icon) next to the user menu. Toggles `.theme-light` on `<html>`, persisted.

---

## Data model notes

The UI expects these fields on an ISCI record (some may already exist — do not break existing ones):

```
id, code, client_id, campaign, job_number, spot_title, description,
air_start_date, tbd_date (bool), agency_id, market, language,
accessibility, audio, music_rights, aspect_ratio, file_format,
spot_length_seconds, placement, created_by, created_at,
edit_history: [{ user, timestamp, field, old, new }]
```

The UI expects these on a Client:

```
id, name, code (4 letters, locked after first ISCI), color, active,
created_at, isci_count (computed)
```

Agency:

```
id, name, is_default (exactly one true), active, created_at
```

User:

```
id, name, email, role ('admin'|'editor'), avatar_url, active,
last_active_at, created_at
```

**Do not migrate the existing DB to match these exactly** — map whatever's there to these names in the UI layer, or ask before schema-changing.

---

## What NOT to change

- Authentication / session handling
- API endpoints (unless a field is missing — then ask)
- Routing strategy (keep whatever's in use)
- Build tooling
- The Reports screen
- Any backend logic

---

## Recommended order

1. Install design tokens → verify the app picks up new colors
2. Dashboard: density toggle + fuzzy search + Cmd-K + Detail route
3. Detail (new read-only screen)
4. Edit: code-locking rule, TBD checkbox, spot length free-integer
5. Create: auto-generated code preview
6. Admin shell: sidebar sub-nav replacing tabs
7. Admin → Clients: card grid + drawer + code-lock enforcement
8. Admin → Agencies: card grid + drawer + default invariant
9. Admin → Users: sortable table + role filter + Add User drawer
10. Theme toggle in topbar

Ask before doing anything destructive (dropping columns, renaming fields, etc.).
