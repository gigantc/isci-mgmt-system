# CLAUDE.md - ISCI Management System

This document provides context for AI assistants (like Claude) working on this project.

**Version**: 2.0.0
**Last Updated**: November 3, 2026

For detailed version history, see [CHANGELOG.md](CHANGELOG.md)
For deployment instructions, see [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)
For UI styling rules (type, shape, controls, tables, page shell), see [docs/design-system.md](docs/design-system.md). Follow it for all UI work.

---

## Project Overview

The ISCI Management System is a web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects. It allows users to create, edit, track, and search ISCI codes with associated project metadata. The system features automatic code generation based on brand/client codes, year, and sequential numbering.

## Tech Stack

- **Framework**: React 19 with React Router v7
- **Language**: JavaScript (JSX) - No TypeScript
- **Styling**: Sass (SCSS) with CSS Modules and modern `@use` syntax; design tokens are CSS custom properties (see [docs/design-system.md](docs/design-system.md))
- **Build Tool**: Vite
- **Server**: React Router SSR
- **Database**: Prisma ORM with PostgreSQL (local and production; Postgres 16)
- **Authentication**: Simple session-based auth using sessionStorage (POC only)

## Project Structure

```
isci-mgmt-system/
├── app/
│   ├── components/        # Reusable UI (ISCIForm, ISCIList, CodeLayout, Modal, Icons, the Admin managers, etc.)
│   ├── containers/        # Page containers with logic (Dashboard, CreateISCI, EditISCI, Detail, Admin, Tools, Reports, Profile, Login, Header)
│   ├── routes/            # Route handlers and API endpoints (home, admin, tools, reports, isci, api.*)
│   ├── hooks/             # Custom React hooks (useSession, useFetchData, useResourceManager, etc.)
│   ├── utils/             # Utility functions (auth.js, api.js, dates.js, palette.js, etc.)
│   ├── lib/               # Library instances (prisma.js)
│   ├── styles/            # _tokens.scss, app.scss (global buttons), _shell.scss and _manager.scss partials
│   ├── assets/            # Global assets (Logo.svg, default_profile_image.jpg)
│   ├── config.js          # App-wide constants (APP_VERSION from package.json)
│   ├── root.jsx           # Root component with layout
│   └── routes.js          # Route configuration
├── docs/
│   └── design-system.md   # UI styling rules
├── prisma/
│   └── schema.prisma      # Database schema (User, Brand, Agency, ISCICode)
├── scripts/
│   └── migrateJsonToDb.js # JSON to database migration script
├── public/
│   └── uploads/profiles/  # User profile images
├── data/                  # Legacy JSON files (deprecated, migrated to DB)
├── package.json
├── vite.config.js
├── react-router.config.js
├── ecosystem.config.cjs   # PM2 configuration
├── nginx.conf             # Nginx reverse proxy config
└── deploy.sh              # Deployment automation script
```

## Key Concepts

### ISCI Code Format

**Format**: `CLIENT(3) + MEDIA TYPE(1) + "-" + YY + SEQ`, plus `H` appended for media type `T`. Rules live in `app/utils/isci.js` (pure, used by client, server and the seed script).

- **CLIENT**: 3-letter client code (e.g., `LVC`)
- **MEDIA TYPE**: `T` Broadcast, `D` Digital (social, CTV, streaming, everything that isn't broadcast or radio), `R` Radio
- **YY**: 2-digit year
- **SEQ**: sequential, pads to 2 digits for 1-99, 3 digits from 100

**Examples**: `LVCT-2517H`, `LVCD-2517`, `LVCR-2517`, `LVCD-25100`

**Sequence scope**: independent per `(client, media type, year)`.

**Legacy SO codes**: `SO` + 3-4 letters + optional `-` + YY + SEQ (`SOLVC-2517`, `SOLVCV-2517`). Retired for new codes, valid forever, never changed. They count toward that client's `D` sequence, so after `SOLVC-2517` the next LVC digital code for 25 is `LVCD-2518`.

**Pending with media** (settings in `app/config.js`, defined in `app/utils/isciSettings.js`): `ISCI_HYPHEN` (new codes include the `-`) and `ISCI_BROADCAST_H` (new `T` codes get the `H`). They only change what is generated; parsing accepts every variant.

**Identity**: duplicates and lookups compare `isciKey(code)` (client, type, yy, seq, with legacy as `D`), so `LVCT2517` equals `LVCT-2517H` and `SOLVC-2517` equals `LVCD-2517`. Filenames use `fileNameCode(code)` (no hyphen).

**Allocation**: the server assigns new codes. `POST /api/isci` calls `allocateCodes(tx, { brandId, placementId, yy, count })` in `app/lib/isciAllocator.server.js` (batch-ready for the matrix tool) and retries on a unique collision. The create form only previews the next code. An explicit code is accepted only if valid, matching the client and the placement's media type, and not a duplicate. PUT and import use the same checks.

### User Management & Authentication

⚠️ **WARNING**: Current authentication is POC only - uses sessionStorage and plain-text passwords (not production-ready).

**User Types** (`userType`): `admin`, `editor`, `viewer`. Admin → Roles in the app describes each.

**Session Management** (`app/utils/auth.js`):
- `saveUserSession(user)`, `getUserSession()`, `clearUserSession()`
- `isAuthenticated()`, `isAdmin(user?)`, `isViewer(user?)`, `canEdit(user?)`, `getUserRoleLabel(user)`, `getCurrentUserName()`
- Role logic lives only in `auth.js`. The role helpers take an optional user and default to the stored session.

**Reading the session during render**: use the `useSession()` hook (`{ user, ready, isAdmin, isViewer, canEdit, roleLabel }`). It returns `user: null, ready: false` on the server and on the first client render, then reads sessionStorage after mount. Never call the `auth.js` getters directly in JSX or render-time values: the server can't see sessionStorage, and the mismatch makes React regenerate the tree (this previously wiped the dark-mode class). Calls inside effects and event handlers are fine. Redirect guards must wait for `ready`.

**Storage**: Prisma database (User model)

### Role-Based Access Control

| Role | Codes | Tools | Reports | Admin |
|------|-------|-------|---------|-------|
| `admin` | Create, edit, delete | Export and import | Yes | Yes |
| `editor` | Create and edit (no delete) | Export only | Yes | No |
| `viewer` | Read-only (Detail view) | No | No | No |

**Implementation**: Header links render only once `ready`. Viewers hitting `/edit/:code` are redirected to `/isci/:code`; `/create`, `/tools`, `/reports` and `/admin` redirect non-permitted roles to `/`. Logged-out users go to `/login`.

### Custom Hooks (Reusable Logic)

All hooks are in `app/hooks/` and exported from `app/hooks/index.js`.

**Import Pattern**: `import { useFetchData, useResourceManager } from "@/hooks";`

#### Available Hooks

| Hook | Purpose | Used By | Lines |
|------|---------|---------|-------|
| `useSession` | Hydration-safe current user + role flags | Header, Dashboard, ISCIList, CmdK, code pages, Admin, Tools, Reports, Profile | ~50 |
| `useFetchData` | Eliminates duplicate fetch patterns with loading/error states | ISCIForm, Dashboard, Tools | 97 |
| `useResourceManager` | Consolidates CRUD operations for manager components | BrandManager, UserManager, AgencyManager | 298 |
| `useFormState` | Centralized form state management with validation | (Created, not yet used) | 170 |
| `useExportData` | Data export with filtering and CSV generation | Tools (Export) | 208 |
| `useImportData` | CSV file imports with preview and validation | Tools (Import) | 220 |
| `useConfirmDialog` | Promise-based confirmation dialogs | All delete operations | ~80 |

**Impact**: 72% code reduction in manager components (BrandManager: 293→82 lines, UserManager: 353→100 lines)

**Details**: See individual hook files in `app/hooks/` for implementation and full API.

### Import/Export System

**Location**: `/tools` page, "Data" group (admins and editors; Import is admin-only); the "Production" group holds the deliverables matrix. Each tool lives in its own folder under `app/containers/Tools/`; add new tools to the `GROUPS` list in `Tools.jsx`.

**Reports** (`/reports`, admins and editors) is Insights only: Data quality, Placement mix, Creation trend.

**Export**: Filter by date, client, placement and spot length, with a preview table; CSV export with all fields

**Import**: Three modes (add new, update existing, replace all), CSV template download, row-by-row validation

**CSV Format**: ISCI Code, Client, Campaign Name, Job Number, Spot Title, Description, Air Date, Market, Agency, Language, Spot Length, Aspect Ratio, File Format, Placement, Audio, Accessibility, Music Rights, Created At, Updated At

**Required**: The `Placement` column must be present on import (the placement name). Legacy `Channel` header still resolves for backward compatibility.

**API Endpoint**: `POST /api/isci/import` - Handler: `app/routes/api.isci.import.js`

### Group by (Dashboard)

A view control (Family / Job / List, no label; List is the table and is stored as `none`; saved in `localStorage['isciz-group']`, default Family; the stored value is applied in an effect so the first render is hydration-safe) switches the Dashboard between cards and the table (List) (`app/components/FamilyCards`). Family is client + campaign + spot title (`familyKey` in `app/utils/families.js`), spanning placements, and every code appears in a card (a singleton gets a card with one pill). A family card shows the spot title, "client · campaign", a count badge ("3 cuts", or "2 of 3 shown" when search narrows it) and pills (length chip plus the mono code, longest first, then placement, then code). Job mode shows the job number · client with its campaign(s), one line per spot title with its pills, and a final "No job number" card. Pills open the code: `/edit/:code` for editors and admins, `/isci/:code` for viewers. "Edit family" and "Edit job" open the bulk editor for the whole group, and the cards update in place after an apply. Search and filters apply first; cards are ordered by their newest visible code, and column sorting only exists in the table. Modes are key functions in `app/utils/grouping.js` (`GROUP_MODES`), so Campaign or Client is one entry. Row checkboxes, the selection bar and keyboard row navigation exist in List view only; switching to cards clears the selection, and Detail's "Select family" and "Select all on this job" open the Dashboard in List view with the codes selected.

### Bulk edit

Admins and editors can change shared fields on many codes at once. On the Dashboard, tick the checkbox column (header box selects all visible rows, shift-click selects a range, Space toggles the keyboard-focused row; viewers see no checkboxes). A selection bar shows "N selected", "Edit N codes" and "Clear". The drawer (`app/components/BulkEditDrawer`) shows each field's shared value or "Mixed values", marks a field as changed only after it is edited (with a per-field "Reset"), and writes only the changed fields. Spot title shows a rename warning. After applying, the list is patched in place and the selection is kept. Selection is pruned to the rows that are still visible when filters change.

**Shortcuts**: on the Detail page, "Select family" (same client, campaign and spot title, `app/utils/families.js`, also used by the Dashboard grouping) and "Select all on this job" open the Dashboard with `/?select=<ids>&edit=1`, applied once after the codes load, so it survives a reload.

**API**: `PUT /api/isci/bulk` (`api.isci.bulk.js`) with `{ ids, changes, updatedBy }`, 1 to 500 ids, one transaction, each code gets its own history entry `{ user, timestamp, bulk: true, count, fields }`. Editable: jobNumber, campaignName, spotTitle, description, airDate (or "TBD"), agency, market, platform, language, closedCaptioning, audio, fileFormat, musicRights, completedAt. `code`, `brandId`, `placementId`, `spotLength` and `aspectRatio` are rejected with a 400. Field storage rules are shared with the single edit in `app/lib/isciFields.server.js`. There is no bulk delete.

### Deliverables matrix tool

**Location**: `/tools`, "Production" group, "Deliverables matrix" (the default tab; admins and editors). Ported from the editors' ISCI Wiz (`docs/research/`), without its ISCI-log step: the database is the log.

**Flow**: Job (job number `######.##`, client, optional campaign, year) → Matrix (drop an .xlsx/.xlsm, check the matched columns, set each placement group's ISCI placement, platform and include switch) → Tune-up (edit titles, lengths, sizes and languages once for all rows) → Review (preview, then "Save codes and download matrix"). State is React only; changing the client or year after a file is loaded starts the matrix over.

**Library**: plain modules in `app/containers/Tools/Matrix/lib/` (workbook read, extract and group, normalizers and suggestions, surgical XLSX writer, filename wrapper). It is loaded with a dynamic `import()` when a file is dropped, so jszip (3.10.1) ships in its own chunk. The XML parser is the browser `DOMParser`; node tests inject one with `setDOMParser()`. Existing codes in a row are detected with `findISCICodes` from `app/utils/isci.js`, and a row that already has a code is skipped.

**Filenames**: `buildFileName` in `app/utils/fileName.js`, the same builder as ISCIForm (empty segments are dropped in the matrix). The platform is not part of the filename.

**Batch endpoint**: `POST /api/isci/batch` (`api.isci.batch.js`, logic in `app/lib/isciBatch.server.js`). One transaction: reuse an existing code when client, year, media type, title, length, aspect, language and platform all match, otherwise allocate. Codes already in the matrix count as taken. `preview: true` writes nothing, and the workbook is always written from the non-preview response. Like the other API routes it has no server-side role check.

**Languages**: full names with an optional region in brackets (`Spanish (US)`, `English (UK, Canada)`); textless masters use `Clean`. Lengths are whole seconds, aspect ratios look like `16:9`.

### Brand/Client Management

**Brand Data Structure**: `id`, `name`, `abbreviation`, `code` (3 uppercase letters), `active`, `createdAt`, `updatedAt`

**Brand Code Requirements**: Exactly 3 uppercase letters (A-Z), unique, validated with `/^[A-Z]{3}$/`

**Storage**: Prisma database (Brand model)

### Placement Management

Each placement carries a media type (`T`, `D` or `R`) that becomes the 4th character of every code created against it. Placements are descriptive labels under a fixed media type: they feed the filename and reports, never the code. Admins can add more in Admin → Placements, always picking T, D or R.

**Placement Data Structure**: `id`, `name` (unique), `mediaType` (`T` | `D` | `R`), `active`, `createdAt`, `updatedAt`

**Media type lock**: changing a placement's media type is blocked once any ISCI code uses it (the API enforces it, like delete).

**Defaults seeded**: Broadcast (T), Digital (D), Radio (R)

**Storage**: Prisma database (Placement model). Managed from Admin → Placements.

### ISCI Code Data Structure

**Key Fields**: `id`, `code`, `brandId`, `placementId`, `brand`, `placement { id, name, mediaType }`, `campaignName`, `jobNumber`, `spotTitle`, `spotLength`, `description`, `language`, `closedCaptioning`, `audio`, `fileFormat`, `airDate`, `aspectRatio`, `musicRights`, `agency`, `market`, `platform`, `createdAt`, `updatedAt`, `completedAt`

**Storage**: Prisma database (ISCICode model). Consumers read placement as `code.placement?.name` — the free-text `channel` column was removed in 1.2.0.

---

## Theming & Design System

**Rules**: [docs/design-system.md](docs/design-system.md) (type roles, mono usage, radii, controls, badges, tables, page shell). Follow it for all UI work.

**Tokens**: CSS custom properties in OKLCH, defined in `app/styles/_tokens.scss`. Light is the default; `html.theme-dark` switches to dark. The theme is saved in `localStorage['isciz-theme']` and applied before paint by the `themeBootstrap` script in `root.jsx` (hence `suppressHydrationWarning` on `<html>`).
- Surfaces: `--frame` (warm gradient page background), `--card` (floating cards), `--paper*`, `--line*`
- Fields: `--field` / `--field-border` for every editable input, select, textarea and search box (lighter than the card in dark mode); `--select-chevron` and `--date-icon` are the Lucide icons drawn in selects and date inputs
- Text: `--ink`, `--ink-1`, `--ink-2`, `--ink-3`; accent text uses `--accent-ink`, status text uses `--ok-ink` / `--warn-ink` / `--danger-ink`
- Accent: soft amber `--accent` with dark `--accent-text` on fills
- Scales: `--text-xs` … `--text-2xl`, `--radius-sm` … `--radius-pill`, `--shadow-card`, `--shadow-drawer`
- In dark mode the frame is deliberately lighter than the cards so panels stand out.

**Fonts**: Figtree (UI) and JetBrains Mono (ISCI codes, client codes, media types, hex values, file names, `kbd` only).

**Global Button Classes** (`app/styles/app.scss`, the only button styles): `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-text`, `.btn-icon`, `.btn-icon-danger`

**Shared layout**:
- `_shell.scss` mixins: sidebar + floating main card + page head + footer (Dashboard, Admin, Tools, Reports)
- `_manager.scss` mixins: shared Admin manager styles (Brand, Placement, Agency, User)
- `CodeLayout` + `AsideSection` components: page frame for Create, Edit, Detail and Profile (form column + 320px aside)
- `Modal` component: shared dialog surface (ConfirmDialog, About)
- `Icons` component: shared line icons
- `AppLogo` component: the amber logo tile (`sm` header, `md` Login, `lg` About)

---

## Routes

### Public Routes

| Route | Handler | Component | Description |
|-------|---------|-----------|-------------|
| `/` | `home.jsx` | Dashboard | Code list (table) or family/job cards, with search, client/placement filters, group by, density toggle, keyboard nav |
| `/isci/:code` | `isci.jsx` | Detail | Read-only view of a code (row click lands here) |
| `/create` | `create.jsx` | CreateISCI | Create new ISCI code (admins and editors) |
| `/edit/:code` | `edit.jsx` | EditISCI | Edit an ISCI code (admins and editors; viewers redirect to `/isci/:code`) |
| `/login` | `login.jsx` | Login | User authentication page (shows demo credentials on purpose) |
| `/profile` | `profile.jsx` | Profile | User profile management (protected) |
| `/tools` | `tools.jsx` | Tools | Deliverables matrix, export and import (admins and editors; Import is admin-only) |
| `/reports` | `reports.jsx` | Reports | Insights (admins and editors) |
| `/admin` | `admin.jsx` | BrandManager, PlacementManager, AgencyManager, UserManager | Brand, placement, agency, and user management (admin-only) |

### API Endpoints

#### Authentication
- **POST /api/auth** - Login (`api.auth.js`) - Request: `{ email, password }` - Response: `{ success, user?, message? }`

#### ISCI Codes
- **GET /api/isci** - Returns all ISCI codes (`api.isci.js`)
- **POST /api/isci** - Create ISCI code (`api.isci.js`)
- **PUT /api/isci/:id** - Update ISCI code (`api.isci.js`)
- **DELETE /api/isci/:id** - Delete ISCI code (`api.isci.js`)
- **POST /api/isci/import** - Import from CSV (`api.isci.import.js`) - Modes: add/update/replace
- **PUT /api/isci/bulk** - Apply the same field changes to many codes (`api.isci.bulk.js`)
- **POST /api/isci/batch** - Assign or reuse codes for matrix rows, with `preview` (`api.isci.batch.js`)
- **GET /api/isci/languages** - Distinct languages used across codes (`api.isci.languages.js`)

#### Agencies
- **/api/agencies** - Agency CRUD (`api.agencies.js`)

#### Brands
- **GET /api/brands** - Returns all brands (`api.brands.js`)
- **POST /api/brands** - Create brand (`api.brands.js`)
- **PUT /api/brands/:id** - Update brand (`api.brands.js`)
- **DELETE /api/brands/:id** - Delete brand (`api.brands.js`)

#### Placements
- **GET /api/placements** - Returns all placements (`api.placements.js`)
- **POST /api/placements** - Create placement (`api.placements.js`, admin-only)
- **PUT /api/placements/:id** - Update placement (`api.placements.js`, admin-only)
- **DELETE /api/placements/:id** - Delete placement, blocked if referenced by any ISCI code (`api.placements.js`, admin-only)

#### Users
- **GET /api/users** - Returns all users (`api.users.js`, admin-only)
- **POST /api/users** - Create user (`api.users.js`, admin-only)
- **PUT /api/users/:id** - Update user (`api.users.js`, admin-only)
- **DELETE /api/users/:id** - Delete user (`api.users.js`, admin-only)
- **PUT /api/user** - Update own profile (`api.user.js`) - Supports FormData with profile image
- **POST /api/user/recently-viewed** - Track viewed codes (`api.user.recently-viewed.js`)

---

## Important Patterns

### Component Organization
Each component lives in its own folder with: Main JSX file, corresponding SCSS module, `index.js` barrel export

### No TypeScript
This project uses **pure JavaScript**. Do not add type annotations, interfaces, or `.ts`/`.tsx` files.

### Import Style
Use extensionless imports with `@/` alias:
```javascript
import ISCIForm from "@/components/ISCIForm";  // ✅ Correct
import ISCIForm from "../components/ISCIForm.jsx";  // ❌ Don't add extension
```

### CSS Modules Pattern
```javascript
import styles from "./Component.module.scss";
<div className={styles.myComponent}>
```

Styles use the CSS custom-property tokens directly (`color: var(--ink-1)`). Shared partials are pulled in with `@use "@/styles/shell";` / `@use "@/styles/manager";` and their mixins (`@include shell.sidebar;`). Note: this project's SCSS uses standard formatting and a 16px root, not the compact style or 62.5% root from the global defaults.

### State Management
- Uses React hooks (`useState`, `useEffect`)
- No external state management library
- Container components manage data flow

### Data Persistence
Uses Prisma ORM with PostgreSQL (local and production). See `prisma/schema.prisma` for models. Schema changes go through `npx prisma migrate dev`; `prisma/migrations/` holds the Postgres baseline (`init`) and later migrations. The old SQLite migrations are archived in `prisma/migrations_sqlite_archive/` (reference only).

---

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (with HMR)
npm run build            # Build for production
npm run preview          # Preview production build
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create/apply migrations to the local Postgres DB
npm run seed:demo        # Dry run of the demo seed (add -- --apply to write)
```

---

## Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Yes
- **Component naming**: PascalCase
- **File naming**: PascalCase for components, `.module.scss` for CSS Modules
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase
- **CSS class names**: camelCase for CSS Module classes
- **SCSS**: Use `@use` instead of `@import`; tokens via `var(--token)`, never raw hex/rgba or font sizes

---

## Important Notes

1. **No TypeScript**: Pure JavaScript only
2. **No Tailwind**: Custom SCSS with CSS Modules
3. **CSS Modules**: Scoped styling with camelCase class names
4. **Modern Sass**: Use `@use` syntax, not `@import`
5. **Code assignment**: the server assigns ISCI codes on create (the form previews them); codes are locked on edit
6. **Brand Codes**: Must be exactly 3 uppercase letters and unique
7. **Database**: Uses Prisma ORM - modify schema in `prisma/schema.prisma`
8. **ISCI Code Format**: `CLIENT + MEDIA TYPE + "-" + YY + SEQ` (+ `H` for broadcast), see ISCI Code Format
9. **Component Structure**: Components (presentational) vs Containers (logic)
10. **Theme**: Light (default) and dark, toggled in the header; see Theming & Design System
11. **Form Behavior**: ISCIForm adapts to create/edit/view modes based on user role
12. **Header Component**: Auto-determines navigation based on user role (via `useSession`)
13. **Navigation States**: Active nav link is a soft pill
14. **CSS Grid Layout**: ISCIList uses CSS Grid (subgrid rows) with sticky headers and two-line cells
15. **Detail vs Edit**: Row click opens the read-only Detail view (`/isci/:code`); Edit (`/edit/:code`) is a button from there
16. **URL Structure**: Uses ISCI codes in URLs (e.g., `/isci/LVCB2501`, `/edit/LVCB2501`)
17. **SSR Hydration**: Read the session with `useSession()`, never during render; the app must hydrate without mismatches
18. **ProfileMenu**: Dropdown with Edit profile, About (version from `APP_VERSION`) and Logout
19. **Role-Based UI**: Admin vs Editor button visibility and form states
20. **Recently Viewed**: Auto-tracked via `/api/user/recently-viewed` endpoint

---

## Common Workflows

### Creating a New ISCI Code
1. Navigate to `/` → Click "+ New ISCI Code"
2. Select client and placement → the form previews the code; the server assigns it on save
3. Fill required fields (Spot Title) → Submit
4. New code saved to database

### Managing Clients (Brands)
1. Navigate to `/admin` → "Clients"
2. Add/edit/deactivate/delete clients (the code locks once a client has codes)
3. Client code validation: 3 uppercase letters, unique
4. Changes saved to database via Prisma

### Managing Users
1. Admin navigates to `/admin` → "Users"
2. Add/edit/delete users (email, name, password, user type)
3. Email validation and duplicate checking enforced
4. Changes saved to database via Prisma

### Editing an ISCI Code
1. Click a row on the Dashboard → read-only Detail view (`/isci/[ISCI-CODE]`)
2. Click "Edit" (admins and editors), or the row's edit icon, → `/edit/[ISCI-CODE]`
3. Form pre-fills (client, placement and code locked)
4. Save; viewers only ever see the Detail view
5. Updates saved with new `updatedAt` timestamp

---

## Troubleshooting

### Dev Server Issues
```bash
rm -rf .react-router node_modules/.vite
npm run dev
```

### Module Resolution Errors
- No `.js`/`.jsx` extensions in imports
- Verify `@/` alias in `vite.config.js`

### SCSS Import Errors
- Use `@use`, not `@import`; partials resolve via the `@/` alias (`@use "@/styles/shell";`)
- Tokens are CSS custom properties (`var(--token)`), not Sass variables

### Hydration Warnings
- A "Hydration failed" error almost always means something read sessionStorage/localStorage during render. Move it to `useSession()` or an effect.

### Database Issues
```bash
npx prisma generate       # Regenerate Prisma Client
npx prisma migrate reset  # Reset database (destructive)
npx prisma studio         # GUI to inspect database
```

### Local database setup

```bash
brew install postgresql@16
brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb isciz_dev
# .env: DATABASE_URL="postgresql://<your-user>@localhost:5432/isciz_dev?schema=public"
npx prisma migrate dev
npm run seed:demo -- --apply
```

The Postgres binaries are keg-only: call them by full path (`/opt/homebrew/opt/postgresql@16/bin/psql`, `pg_dump`) or add that directory to `PATH`. The seed upserts demo users, agencies and placements (create-only) and reseeds brands and codes; see the header of `scripts/seedDemoData.js`.

---

## Production Deployment

**Live URL**: https://54-158-87-192.sslip.io (Let's Encrypt cert via certbot; the bare IP returns 404)
**Platform**: AWS EC2 (Ubuntu 24.04 LTS), PM2, Nginx

**Quick Deploy**:
```bash
ssh -i key.pem ubuntu@54.158.87.192
cd /var/www/isci-mgmt-system && ./deploy.sh
pm2 status && pm2 logs isci-mgmt
```

**See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for complete deployment guide.**

---

## Future Enhancements

- [ ] Production-ready authentication (OAuth, JWT)
- [ ] File attachments for ISCI codes
- [ ] Dashboard analytics and reporting
- [ ] Activity logs and audit trail
- [ ] Email notifications for due dates
- [x] Bulk edit (multi-select and an "Edit N codes" drawer)
- [ ] Bulk delete
- [ ] Brand usage statistics
- [ ] Automatic year rollover handling
- [x] Exportable Slate feature (1920x1080 JPG)
- [x] SSL/HTTPS setup
- [ ] S3 backups

---

## Contact & Collaboration

When working on this project:
- Follow existing patterns and conventions
- Keep code simple and maintainable
- Document significant changes
- Test thoroughly before committing
- Update CLAUDE.md and CHANGELOG.md when adding major features

---

**For detailed version history, see [CHANGELOG.md](CHANGELOG.md)**
