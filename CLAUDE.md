# CLAUDE.md - ISCI Management System

This document provides context for AI assistants (like Claude) working on this project.

**Version**: 0.9.1-alpha - Database Migration & Quick Wins
**Last Updated**: January 26, 2026

For detailed version history, see [CHANGELOG.md](CHANGELOG.md)
For deployment instructions, see [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)

---

## Project Overview

The ISCI Management System is a web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects. It allows users to create, edit, track, and search ISCI codes with associated project metadata. The system features automatic code generation based on brand/client codes, year, and sequential numbering.

## Tech Stack

- **Framework**: React 19 with React Router v7
- **Language**: JavaScript (JSX) - No TypeScript
- **Styling**: Sass (SCSS) with CSS Modules and modern `@use` syntax
- **Build Tool**: Vite
- **Server**: React Router SSR
- **Database**: Prisma ORM with SQLite (local) / PostgreSQL (production)
- **Authentication**: Simple session-based auth using sessionStorage (POC only)

## Project Structure

```
isci-mgmt-system/
├── app/
│   ├── components/        # Reusable UI components (BrandManager, UserManager, ISCIForm, ISCIList, etc.)
│   ├── containers/        # Container components with logic (Dashboard, EditISCI, Profile, Header)
│   ├── routes/            # Route handlers and API endpoints (home, admin, reports, api.*)
│   ├── hooks/             # Custom React hooks (useFetchData, useResourceManager, useFormState, etc.)
│   ├── utils/             # Utility functions (auth.js, api.js)
│   ├── lib/               # Library instances (prisma.js)
│   ├── styles/            # Global styles (_variables.scss, app.scss)
│   ├── assets/            # Global assets (Logo.svg, default_profile_image.jpg)
│   ├── types/             # Type definitions as constants (isci.js)
│   ├── root.jsx           # Root component with layout
│   └── routes.js          # Route configuration
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

**Auto-Generated Format**: `[BRAND][YEAR][NUMBER]`

- **BRAND**: 4-letter brand code (e.g., `LVCI`, `NIKE`, `APPL`)
- **YEAR**: 2-digit year (e.g., `25` for 2025)
- **NUMBER**: Sequential 2-3 digit number (pads to 2 digits for 1-99, uses 3 digits for 100+)

**Examples**: `LVCI2501`, `NIKE2515`, `APPL25100`

**Validation**: `/^[A-Z]{4}\d{4,5}$/` (8-9 characters)

**Implementation**: See `app/components/ISCIForm/ISCIForm.jsx` - `generateISCICode()` function

### User Management & Authentication

⚠️ **WARNING**: Current authentication is POC only - uses sessionStorage and plain-text passwords (not production-ready).

**User Types**:
- `admin`: Full access - can manage brands, users, and ISCI codes
- `editor`: Limited access - view-only for ISCI codes

**Session Management** (`app/utils/auth.js`):
- `saveUserSession(user)`, `getUserSession()`, `clearUserSession()`
- `isAuthenticated()`, `isAdmin()`, `getCurrentUserName()`

**Storage**: Prisma database (User model)

### Role-Based Access Control

**Admin Users**: Full CRUD access to all features, Admin panel, Reports page

**Editor Users**: View-only access to ISCI codes, no Admin/Reports access, no delete buttons

**Implementation**: Navigation links hidden for non-admins, edit pages become read-only views, page-level protection with redirects

### Custom Hooks (Reusable Logic)

All hooks are in `app/hooks/` and exported from `app/hooks/index.js`.

**Import Pattern**: `import { useFetchData, useResourceManager } from "@/hooks";`

#### Available Hooks

| Hook | Purpose | Used By | Lines |
|------|---------|---------|-------|
| `useFetchData` | Eliminates duplicate fetch patterns with loading/error states | ISCIForm, Dashboard, Reports | 97 |
| `useResourceManager` | Consolidates CRUD operations for manager components | BrandManager, UserManager, AgencyManager | 298 |
| `useFormState` | Centralized form state management with validation | (Created, not yet used) | 170 |
| `useExportData` | Data export with filtering and CSV generation | Reports | 208 |
| `useImportData` | CSV file imports with preview and validation | Reports | 220 |
| `useConfirmDialog` | Promise-based confirmation dialogs | All delete operations | ~80 |

**Impact**: 72% code reduction in manager components (BrandManager: 293→82 lines, UserManager: 353→100 lines)

**Details**: See individual hook files in `app/hooks/` for implementation and full API.

### Import/Export System

**Location**: `/reports` page (admin-only)

**Export**: Advanced filtering by date/status/editor/brand/channel/length, CSV export with all fields

**Import**: Three modes (add new, update existing, replace all), CSV template download, row-by-row validation

**CSV Format**: ISCI Code, Brand, Campaign Name, Spot Title, Spot Length, Assigned Editor, Status, Channel, Aspect Ratio, Version, Language, Closed Captioning, Audio, Air Date, Description

**API Endpoint**: `POST /api/isci/import` - Handler: `app/routes/api.isci.import.js`

### Brand/Client Management

**Brand Data Structure**: `id`, `name`, `abbreviation`, `code` (4 uppercase letters), `active`, `createdAt`, `updatedAt`

**Brand Code Requirements**: Exactly 4 uppercase letters (A-Z), unique, validated with `/^[A-Z]{4}$/`

**Storage**: Prisma database (Brand model)

### ISCI Status Types

Defined in `app/types/isci.js`: `PENDING`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `ARCHIVED`

### ISCI Code Data Structure

**Key Fields**: `id`, `code`, `brandId`, `assignedEditor`, `brand`, `campaignName`, `spotTitle`, `spotLength`, `description`, `language`, `closedCaptioning`, `audio`, `airDate`, `aspectRatio`, `version`, `channel`, `status`, `createdAt`, `updatedAt`, `completedAt`

**Storage**: Prisma database (ISCICode model)

---

## Dark Mode Theme

Custom dark mode theme with color palette defined in `app/styles/_variables.scss`:

```scss
$black: #212529;      // Background
$white: #FFFAE7;      // Text
$gray: #3d434b;       // UI elements/borders
$yellow: #C2FF00;     // Primary accent
$pink: #ff00b7;       // Secondary accent
$blue: #1405ff;       // Secondary accent
$teal: #00DEB5;       // Status colors
$red: #FF2300;        // Delete/Error states
$orange: #febc2c;     // Pending/Warning states
```

**Global Button Classes**: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-text`

---

## Routes

### Public Routes

| Route | Handler | Component | Description |
|-------|---------|-----------|-------------|
| `/` | `home.jsx` | Dashboard | Main dashboard with search, Recently Viewed, Assigned Projects, Recently Created |
| `/create` | `create.jsx` | CreateISCI | Create new ISCI code (admin-only) |
| `/edit/:code` | `edit.jsx` | EditISCI | Edit/view ISCI code (admins: edit, editors: read-only) |
| `/login` | `login.jsx` | - | User authentication page |
| `/profile` | `profile.jsx` | Profile | User profile management (protected) |
| `/reports` | `reports.jsx` | - | Import/export data management (admin-only) |
| `/admin` | `admin.jsx` | BrandManager, UserManager | Brand and user management (admin-only) |

### API Endpoints

#### Authentication
- **POST /api/auth** - Login (`api.auth.js`) - Request: `{ email, password }` - Response: `{ success, user?, message? }`

#### ISCI Codes
- **GET /api/isci** - Returns all ISCI codes (`api.isci.js`)
- **POST /api/isci** - Create ISCI code (`api.isci.js`)
- **PUT /api/isci/:id** - Update ISCI code (`api.isci.js`)
- **DELETE /api/isci/:id** - Delete ISCI code (`api.isci.js`)
- **POST /api/isci/import** - Import from CSV (`api.isci.import.js`) - Modes: add/update/replace

#### Brands
- **GET /api/brands** - Returns all brands (`api.brands.js`)
- **POST /api/brands** - Create brand (`api.brands.js`)
- **PUT /api/brands/:id** - Update brand (`api.brands.js`)
- **DELETE /api/brands/:id** - Delete brand (`api.brands.js`)

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

SCSS imports: `@use "@/styles/variables" as v;` then access as `v.$variable-name`

### State Management
- Uses React hooks (`useState`, `useEffect`)
- No external state management library
- Container components manage data flow

### Data Persistence
Uses Prisma ORM with SQLite (local) / PostgreSQL (production). See `prisma/schema.prisma` for models.

---

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (with HMR)
npm run build            # Build for production
npm run preview          # Preview production build
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Run database migrations
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
- **SCSS**: Use `@use` instead of `@import`, namespace variables with `v.$`

---

## Important Notes

1. **No TypeScript**: Pure JavaScript only
2. **No Tailwind**: Custom SCSS with CSS Modules
3. **CSS Modules**: Scoped styling with camelCase class names
4. **Modern Sass**: Use `@use` syntax, not `@import`
5. **Auto-Generation**: ISCI codes auto-generated on create (editable on edit)
6. **Brand Codes**: Must be exactly 4 uppercase letters and unique
7. **Database**: Uses Prisma ORM - modify schema in `prisma/schema.prisma`
8. **ISCI Code Format**: `[BRAND][YEAR][NUMBER]` format enforced
9. **Component Structure**: Components (presentational) vs Containers (logic)
10. **Dark Mode**: Fixed dark mode theme, no light mode
11. **Form Behavior**: ISCIForm adapts to create/edit/view modes based on user role
12. **Header Component**: Auto-determines navigation based on user role
13. **Navigation States**: Active links show orange underline (3px)
14. **CSS Grid Layout**: ISCIList uses CSS Grid with sticky headers
15. **Edit Workflow**: Decoupled from Dashboard with dedicated route (`/edit/:code`)
16. **URL Structure**: Uses ISCI codes in URLs (e.g., `/edit/LVCI2501`)
17. **SSR Hydration**: Header uses lazy state initializer for user session
18. **ProfileMenu**: Dropdown with Edit Profile and Logout
19. **Role-Based UI**: Admin vs Editor button visibility and form states
20. **Recently Viewed**: Auto-tracked via `/api/user/recently-viewed` endpoint

---

## Common Workflows

### Creating a New ISCI Code
1. Navigate to `/` → Click "+ New ISCI Code"
2. Select brand → Code auto-generates
3. Fill required fields (Spot Title) → Submit
4. New code saved to database

### Managing Brands
1. Navigate to `/admin` → "Brand Management" tab
2. Add/edit/deactivate/delete brands
3. Brand code validation: 4 uppercase letters, unique
4. Changes saved to database via Prisma

### Managing Users
1. Admin navigates to `/admin` → "User Management" tab
2. Add/edit/delete users (email, name, password, user type)
3. Email validation and duplicate checking enforced
4. Changes saved to database via Prisma

### Editing an ISCI Code
1. Click "Edit" (admin) or "View" (editor) on existing code
2. Navigate to `/edit/[ISCI-CODE]`
3. Form pre-fills (brand shown as disabled)
4. Admin can edit and save, editor sees read-only view
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
- Use `@use "@/styles/variables" as v;` not `@import`
- Access variables with `v.$variable-name`

### Database Issues
```bash
npx prisma generate       # Regenerate Prisma Client
npx prisma migrate reset  # Reset database (destructive)
npx prisma studio         # GUI to inspect database
```

---

## Production Deployment

**Live URL**: http://54.158.87.192
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
- [ ] Batch operations (bulk edit/delete)
- [ ] Brand usage statistics
- [ ] Automatic year rollover handling
- [ ] Exportable Slate feature (1920x1080 JPG)
- [ ] SSL/HTTPS setup
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
