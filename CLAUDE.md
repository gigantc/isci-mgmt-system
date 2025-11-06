# CLAUDE.md - ISCI Management System

This document provides context for AI assistants (like Claude) working on this project.

## Project Overview

The ISCI Management System is a web application for managing ISCI (Industry Standard Coding Identification) codes for video editing projects. It allows users to create, edit, track, and search ISCI codes with associated project metadata. The system features automatic code generation based on brand/client codes, year, and sequential numbering.

## Tech Stack

- **Framework**: React 19 with React Router v7
- **Language**: JavaScript (JSX) - No TypeScript
- **Styling**: Sass (SCSS) with CSS Modules and modern `@use` syntax
- **Build Tool**: Vite
- **Server**: React Router SSR
- **Data Storage**: JSON files (`data/isci-codes.json`, `data/brands.json`, `data/users.json`)
- **Authentication**: Simple session-based auth using sessionStorage (POC only)

## Project Structure

```
isci-mgmt-system/
├── app/
│   ├── components/              # Reusable UI components
│   │   ├── BrandManager/       # Brand/client management component
│   │   │   ├── BrandManager.jsx
│   │   │   ├── BrandManager.module.scss
│   │   │   └── index.js
│   │   ├── UserManager/        # User management component
│   │   │   ├── UserManager.jsx
│   │   │   ├── UserManager.module.scss
│   │   │   └── index.js
│   │   ├── ProfileMenu/        # Profile dropdown menu
│   │   │   ├── ProfileMenu.jsx
│   │   │   ├── ProfileMenu.module.scss
│   │   │   └── index.js
│   │   ├── ISCIForm/           # Form for creating/editing ISCI codes
│   │   │   ├── ISCIForm.jsx
│   │   │   ├── ISCIForm.module.scss
│   │   │   └── index.js
│   │   └── ISCIList/           # CSS Grid view for listing codes
│   │       ├── ISCIList.jsx
│   │       ├── ISCIList.module.scss
│   │       └── index.js
│   ├── containers/             # Container components with logic
│   │   ├── Dashboard/          # Main dashboard container (create & list)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.module.scss
│   │   │   └── index.js
│   │   ├── EditISCI/           # Edit ISCI code container
│   │   │   ├── EditISCI.jsx
│   │   │   ├── EditISCI.module.scss
│   │   │   └── index.js
│   │   ├── Profile/            # User profile management container
│   │   │   ├── Profile.jsx
│   │   │   ├── Profile.module.scss
│   │   │   └── index.js
│   │   └── Header/             # Global header component
│   │       ├── Header.jsx
│   │       ├── Header.module.scss
│   │       ├── assets/
│   │       │   ├── Logo.svg
│   │       │   └── default_profile_image.jpg
│   │       └── index.js
│   ├── routes/                 # Route handlers
│   │   ├── admin.jsx           # Admin panel route (brands & users)
│   │   ├── login.jsx           # Login page route
│   │   ├── profile.jsx         # User profile page route
│   │   ├── create.jsx          # Create ISCI code route
│   │   ├── edit.jsx            # Edit ISCI code route
│   │   ├── home.jsx            # Home page route
│   │   ├── api.auth.js         # Authentication API endpoints
│   │   ├── api.user.js         # User profile update API
│   │   ├── api.users.js        # User management API endpoints
│   │   ├── api.brands.js       # Brand API endpoints
│   │   └── api.isci.js         # ISCI code API endpoints
│   ├── utils/                  # Utility functions
│   │   └── auth.js             # Authentication helper functions
│   ├── styles/                 # Global styles and variables
│   │   ├── _variables.scss     # Sass variables (colors, theme)
│   │   └── app.scss            # Global application styles + button classes
│   ├── types/                  # Type definitions (as constants)
│   │   └── isci.js             # ISCI status constants
│   ├── root.jsx                # Root component with layout
│   └── routes.js               # Route configuration
├── data/
│   ├── brands.json             # Brand/client data (15 brands)
│   ├── users.json              # User accounts (9 users: 1 admin, 8 editors)
│   └── isci-codes.json         # ISCI code data (100 test records)
├── public/
│   └── uploads/
│       └── profiles/           # User profile images
├── public/                     # Static assets
├── package.json
├── vite.config.js
├── react-router.config.js
└── README.md
```

## Key Concepts

### ISCI Code Format

**Auto-Generated Format**: `[BRAND][YEAR][NUMBER]`

- **BRAND**: 4-letter brand code (e.g., `LVCI`, `NIKE`, `APPL`)
- **YEAR**: 2-digit year (e.g., `25` for 2025)
- **NUMBER**: Sequential 2-3 digit number (e.g., `01`, `02`, `100`)
  - Pads to 2 digits for numbers 1-99
  - Uses 3 digits for numbers 100+

**Examples**:
- `LVCI2501` - Las Vegas Convention, year 2025, 1st spot
- `NIKE2515` - Nike, year 2025, 15th spot
- `APPL25100` - Apple, year 2025, 100th spot

**Validation**:
- Format: `/^[A-Z]{4}\d{4,5}$/`
- Length: 8-9 characters
- Auto-generated when creating new codes
- Editable when editing existing codes

### Auto-Generation Algorithm

When a user creates a new ISCI code:

1. User selects a brand from dropdown
2. System extracts brand's 4-letter code (e.g., `LVCI`)
3. Gets current 2-digit year (e.g., `25` for 2025)
4. Searches all existing codes for pattern `LVCI25*`
5. Extracts numeric suffixes and finds highest number
6. Increments by 1
7. Pads to 2 digits (if < 100) or uses 3 digits (if >= 100)
8. Combines: `LVCI` + `25` + `01` = `LVCI2501`

**Implementation**: `app/components/ISCIForm/ISCIForm.jsx` - `generateISCICode()` function

```javascript
const generateISCICode = (brandCode) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const brandCodes = allCodes.filter(c => {
    const codeStart = `${brandCode}${currentYear}`;
    return c.code.startsWith(codeStart);
  });

  let highestNumber = 0;
  brandCodes.forEach(c => {
    const match = c.code.match(new RegExp(`${brandCode}${currentYear}(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > highestNumber) highestNumber = num;
    }
  });

  const nextNumber = highestNumber + 1;
  const paddedNumber = nextNumber < 100 ?
    nextNumber.toString().padStart(2, '0') :
    nextNumber.toString();

  return `${brandCode}${currentYear}${paddedNumber}`;
};
```

### User Management & Authentication

**WARNING**: The current authentication system is a POC (Proof of Concept) only and NOT production-ready. It uses sessionStorage and plain-text passwords stored in JSON files.

**User Data Structure**:
```javascript
{
  id: string,                  // UUID
  email: string,               // Email address (unique, required)
  password: string,            // Plain text password (NOT SECURE - POC only)
  firstName: string,           // First name (required)
  lastName: string,            // Last name (required)
  userType: string,            // "admin" or "editor"
  createdAt: string,           // ISO timestamp
  profileUpdatedAt: string,    // ISO timestamp (null if never updated)
  profileImage: string         // Path to uploaded image (null if no image)
}
```

**User Types**:
- `admin`: Full access - can manage brands, users, and ISCI codes
- `editor`: Limited access - can only manage ISCI codes

**Authentication Flow**:
1. User enters email/password on `/login`
2. System checks credentials against `data/users.json`
3. On success, user object stored in sessionStorage
4. Session persists until browser tab closed or logout
5. Protected routes check authentication via `isAuthenticated()` helper

**Profile Management**:
- Users can update their own profile at `/profile`
- Supports profile image upload (JPEG, PNG, GIF, WebP, max 5MB)
- Password change requires current password verification
- Images stored in `public/uploads/profiles/`
- Default profile image used if no custom image uploaded

**Session Management** (`app/utils/auth.js`):
- `saveUserSession(user)` - Store user in sessionStorage
- `getUserSession()` - Retrieve current user
- `clearUserSession()` - Logout (clear session)
- `isAuthenticated()` - Check if user logged in
- `isAdmin()` - Check if current user is admin
- `getCurrentUserName()` - Get user's full name

**Storage**: `data/users.json`

### Brand/Client Management

Brands are managed separately from ISCI codes to enable code auto-generation.

**Brand Data Structure**:
```javascript
{
  id: string,              // UUID
  name: string,            // Full brand/client name (required)
  code: string,            // 4-letter brand code (required, unique)
  active: boolean,         // Whether brand is available for new codes
  createdAt: string,       // ISO timestamp
  updatedAt: string        // ISO timestamp
}
```

**Brand Code Requirements**:
- Exactly 4 uppercase letters (A-Z)
- Must be unique across all brands
- Validated with regex: `/^[A-Z]{4}$/`
- Examples: `LVCI`, `NIKE`, `APPL`, `COCA`, `TOYT`

**Storage**: `data/brands.json`

### ISCI Status Types

Defined in `app/types/isci.js`:
- `PENDING` - Not yet started
- `IN_PROGRESS` - Currently being worked on
- `IN_REVIEW` - Under review
- `COMPLETED` - Finished and approved
- `ARCHIVED` - Completed and archived

### ISCI Code Data Structure

Each ISCI code object contains:
```javascript
{
  id: string,                  // UUID
  code: string,                // Auto-generated ISCI code (required)
  brandId: string,             // Reference to brand ID (required)
  assignedEditor: string,      // Editor name (optional)
  brand: string,               // Brand/Client name (required, denormalized)
  campaignName: string,        // Campaign identifier (optional)
  spotTitle: string,           // Full spot title (required)
  spotLength: number,          // Duration in seconds: 6, 10, 15, 30, 45, 60 (optional)
  description: string,         // Notes about the project (optional)
  language: string,            // e.g., "English" (default: "English")
  closedCaptioning: string,    // "Yes" or "No" (default: "No")
  audio: string,               // e.g., "Stereo LR" (default: "Stereo LR")
  airDate: string,             // Air/Start date (ISO date, optional)
  aspectRatio: string,         // e.g., "16:9", "9:16" (default: "16:9")
  version: string,             // Version/Cut: A, B, C, D, E (default: "A")
  channel: string,             // Output channel: Broadcast, CTV, Digital, Social, OLV, Radio (default: "Broadcast")
  status: string,              // One of ISCIStatus values (default: "pending")
  createdAt: string,           // ISO timestamp
  updatedAt: string,           // ISO timestamp
  completedAt: string          // ISO timestamp (optional)
}
```

## Important Patterns

### Component Organization

Each component/container lives in its own folder with:
- Main JSX file
- Corresponding SCSS file
- `index.js` barrel export

### No TypeScript

This project uses **pure JavaScript**. Do not add:
- Type annotations
- Interfaces
- TypeScript-specific syntax
- `.ts` or `.tsx` file extensions

### Import Style

Use extensionless imports (Vite resolves them):
```javascript
import ISCIForm from "@/components/ISCIForm";  // ✅ Correct (using @ alias)
import ISCIForm from "../components/ISCIForm.jsx";  // ❌ Don't add extension
```

For CSS Modules:
```javascript
import styles from "./Component.module.scss";

<div className={styles.myComponent}>
```

For SCSS variables, use the `@/` alias:
```scss
@use "@/styles/variables" as v;

.myComponent {
  background-color: v.$black;
  color: v.$white;
}
```

### State Management

- Uses React hooks (`useState`, `useEffect`)
- No external state management library
- Local component state for forms
- Container components manage data flow

### Data Persistence

Currently uses JSON file storage:
- **ISCI Codes**: `data/isci-codes.json`
  - Read: `GET /api/isci` - Returns all codes
  - Write: `POST /api/isci` - Saves entire array
- **Brands**: `data/brands.json`
  - Read: `GET /api/brands` - Returns all brands
  - Write: `POST /api/brands` - Saves entire array
- **Users**: `data/users.json`
  - Read: `GET /api/users` - Returns all users
  - Write: `POST /api/users` - Saves entire array
  - Profile Update: `PUT /api/user` - Updates individual user with file upload support
- Uses Node.js `fs/promises` for file operations
- Profile images stored in `public/uploads/profiles/`

## Dark Mode Theme

The application uses a custom dark mode theme with the following color palette:

```scss
// Color Palette (defined in app/styles/_variables.scss)
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

**Theme Variables:**
- Background: `$bg-primary` (#212529)
- Text: `$text-primary` (#FFFAE7)
- Accent: `$accent` (#febc2c - orange)
- Hover: `$hover` (#FF2300 - red)
- Disabled: `$disabled` (#3d434b)

## Routes

### Public Routes

- **`/` (Home)**: Main dashboard with ISCI code list and create functionality
  - Handler: `app/routes/home.jsx`
  - Component: `Dashboard` container
  - Features: List view, search, create new codes

- **`/edit/:code` (Edit ISCI Code)**: Dedicated edit page for a specific ISCI code
  - Handler: `app/routes/edit.jsx`
  - Component: `EditISCI` container
  - URL Parameter: `:code` - The ISCI code (e.g., `/edit/LVCI2501`)
  - Features: Edit form pre-filled with existing data

- **`/login` (Login)**: User authentication page
  - Handler: `app/routes/login.jsx`
  - Features: Email/password login, session creation

- **`/profile` (User Profile)**: User profile management page (protected)
  - Handler: `app/routes/profile.jsx`
  - Component: `Profile` container
  - Features: Edit name, email, password, upload profile image
  - Protected: Requires authentication

- **`/admin` (Admin Panel)**: Brand and user management interface (protected)
  - Handler: `app/routes/admin.jsx`
  - Components: `BrandManager`, `UserManager`
  - Features: Tabbed interface for managing brands and users
  - Protected: Admin only (redirects editors to home)

### API Endpoints

#### Authentication

**POST /api/auth**
- Authenticates user with email/password
- Handler: `app/routes/api.auth.js` - `action()` function
- Request Body: `{ email: string, password: string }`
- Response: `{ success: boolean, user?: object, message?: string }`

#### ISCI Codes

**GET /api/isci**
- Returns all ISCI codes as JSON array
- Handler: `app/routes/api.isci.js` - `loader()` function

**POST /api/isci**
- Saves ISCI codes (full array replacement)
- Handler: `app/routes/api.isci.js` - `action()` function
- Request Body: Array of ISCI code objects

#### Brands

**GET /api/brands**
- Returns all brands as JSON array
- Handler: `app/routes/api.brands.js` - `loader()` function

**POST /api/brands**
- Saves brands (full array replacement)
- Handler: `app/routes/api.brands.js` - `action()` function
- Request Body: Array of brand objects

#### Users

**GET /api/users**
- Returns all users as JSON array
- Handler: `app/routes/api.users.js` - `loader()` function
- Used by: UserManager component (admin only)

**POST /api/users**
- Saves users (full array replacement)
- Handler: `app/routes/api.users.js` - `action()` function
- Request Body: Array of user objects
- Used by: UserManager component (admin only)

**PUT /api/user**
- Updates individual user profile
- Handler: `app/routes/api.user.js` - `action()` function
- Request Body: FormData with user fields and optional profileImage file
- Supports: Name, email, password updates, profile image upload
- Used by: Profile component (self-service)

## Common Tasks

### Adding a New Component

1. Create folder: `app/components/ComponentName/`
2. Add `ComponentName.jsx` with component logic
3. Add `ComponentName.scss` for styles (use `@use "@/styles/variables" as v;`)
4. Add `index.js` with: `export { default } from "./ComponentName";`

### Adding a New Route

1. Create route file in `app/routes/` (e.g., `about.jsx`)
2. Update `app/routes.js` to register the route
3. Use React Router v7 conventions (loader, action, meta functions)

### Modifying ISCI Data Structure

1. Update `data/isci-codes.json` test data
2. Update JSDoc comments or inline documentation
3. Update validation in `app/components/ISCIForm/ISCIForm.jsx`
4. Update display in `app/components/ISCIList/ISCIList.jsx`

### Adding a New Brand

**Via UI**: Navigate to `/admin` and use the BrandManager form

**Manually**: Edit `data/brands.json`
```json
{
  "id": "6",
  "name": "Brand Name",
  "code": "BRND",
  "active": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Styling Guidelines

- **CSS Modules**: All component styles use `.module.scss` files for scoped styling
- **Naming Convention**: Use camelCase for CSS Module class names (e.g., `.myComponent`, `.headerActions`)
- **Modern Sass**: Use `@use` syntax instead of deprecated `@import`
- **Variables**: Import with `@use "@/styles/variables" as v;` and access as `v.$variable-name`
- **Global Styles**: Located in `app/styles/app.scss` (includes button classes: `.btn-primary`, `.btn-secondary`, `.btn-text`)
- **Color Variables**: Defined in `app/styles/_variables.scss`

**CSS Modules Pattern:**
```javascript
// Import styles
import styles from "./Component.module.scss";

// Use in JSX
<div className={styles.myComponent}>
  <button className={styles.primaryButton}>Click me</button>
</div>
```

**SCSS Structure:**
```scss
// Component.module.scss
@use "@/styles/variables" as v;

.myComponent {
  background-color: v.$black;

  .primaryButton {
    color: v.$accent;
  }
}
```

**Global Button Classes** (non-modular, available everywhere):
- `.btn-primary` - Primary action button (yellow background)
- `.btn-secondary` - Secondary action button (subtle background)
- `.btn-text` - Text-only button (transparent background)

### Path Aliasing

The project uses `@/` as an alias for the `app/` directory:
- JavaScript/JSX imports: Works automatically with Vite
- SCSS imports: Use `@use "@/styles/variables" as v;`
- Configured in `vite.config.js`

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Future Enhancements (Roadmap)

- [ ] Database integration (PostgreSQL/MySQL)
- [ ] User authentication and authorization
- [ ] Multi-user collaboration
- [ ] File attachments for ISCI codes
- [ ] Export to CSV/Excel
- [ ] Advanced filtering and sorting by brand, status, date
- [ ] Dashboard analytics and reporting
- [ ] Activity logs and audit trail
- [ ] Email notifications for due dates
- [ ] Batch operations (bulk edit/delete)
- [ ] Brand usage statistics and reporting
- [ ] Automatic year rollover handling

## Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Yes, use semicolons
- **Component naming**: PascalCase for components
- **File naming**: PascalCase for component files, `.module.scss` for CSS Modules
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase
- **CSS class names**: camelCase for CSS Module classes
- **SCSS**: Use `@use` instead of `@import`, namespace variables with `v.$`

## Testing Data

### Brands (`data/brands.json`)

15 brands including:
- **LVCI**: Las Vegas Convention and Visitors Authority
- **NIKE**: Nike
- **APPL**: Apple
- **COCA**: Coca-Cola
- **TOYT**: Toyota
- And 10 more...

### ISCI Codes (`data/isci-codes.json`)

100 test ISCI codes with:
- Auto-generated codes in new format (LVCI2501, NIKE2502, etc.)
- Various brands with brandId references
- Different editors
- All status types represented
- Various spot lengths (6s, 10s, 15s, 30s, 45s, 60s)
- Different channels (Broadcast, Digital, CTV, Social, OLV, Radio)
- Multiple aspect ratios (16:9, 9:16, 4:3, 1:1, 2.39:1)
- Multiple versions (A, B, C, D, E)

## Important Notes

1. **No TypeScript**: This project uses pure JavaScript. Do not reintroduce TypeScript syntax.

2. **No Tailwind**: Tailwind CSS has been removed. All styling is done with custom SCSS and the defined color palette.

3. **CSS Modules**: All component styles use `.module.scss` files for scoped styling. Use camelCase for class names and import as `import styles from "./Component.module.scss"`.

4. **Modern Sass**: Use `@use` syntax instead of deprecated `@import`. All variables are namespaced with `v.$`.

5. **Auto-Generation**: ISCI codes are auto-generated based on brand selection. Users cannot manually enter codes when creating (only when editing).

6. **Brand Codes**: Brand codes must be exactly 4 uppercase letters and unique. This is enforced in the BrandManager component.

7. **Data Storage**: Currently uses JSON files. When migrating to a database:
   - Keep the API endpoints the same
   - Only modify route handler files (`app/routes/api.*.js`)
   - Consider adding foreign key relationships (brandId → brands.id)
   - Add proper error handling and validation

8. **ISCI Code Format**: The new format `[BRAND][YEAR][NUMBER]` is enforced. Do not revert to the old 8-character format.

9. **Component Structure**: Maintain the components/containers separation:
   - **Components**: Presentational, reusable UI elements
   - **Containers**: Business logic, data fetching, state management

10. **Dark Mode**: The application uses a fixed dark mode theme. Do not add light mode or theme switching functionality.

11. **Form Behavior**: ISCIForm behaves differently in create vs edit mode:
    - **Create**: Brand dropdown shown, code field is read-only and auto-generated
    - **Edit**: Brand shown as disabled text (can't change), code field is editable

12. **Header Component**: The Header component is flexible and reusable across routes. Configure button visibility using props: `showAdminButton`, `showCreateButton`, `showBackButton`.

13. **CSS Grid Layout**: ISCIList uses CSS Grid instead of HTML tables for better flexibility and modern styling. The grid header uses `position: sticky` for a fixed header while content scrolls.

14. **Edit Workflow**: Edit functionality is decoupled from Dashboard - it has its own route (`/edit/:code`) and container (`EditISCI`). This allows editing from multiple entry points in the future.

15. **URL Structure**: ISCI codes are used in URLs instead of UUIDs (e.g., `/edit/LVCI2501`). This makes URLs more readable and shareable.

16. **SSR Hydration**: When using auth functions like `getUserSession()` in components, always use `useState` and `useEffect` to avoid hydration mismatches. Never call these functions during render - they must run only on the client side after hydration completes.

17. **ProfileMenu Component**: Dropdown menu in header provides access to "Edit Profile" and "Logout" actions. Uses click-outside detection to auto-close.

18. **User Management Access**: Only admins can access the User Management tab in the admin panel. The tab interface makes it easy to switch between Brand and User management.

## Workflow

### Creating a New ISCI Code

1. User navigates to home (`/`)
2. Clicks "Create New ISCI Code" button
3. Selects brand from dropdown (only active brands shown)
4. Code is automatically generated (e.g., `LVCI2502` if `LVCI2501` exists)
5. User fills in required fields (Spot Title) and optional fields
6. Submits form
7. New code is added to `data/isci-codes.json`

### Managing Brands

1. User navigates to Admin Panel (`/admin`)
2. Selects "Brand Management" tab
3. Can add, edit, activate/deactivate, or delete brands
4. Brand code validation ensures 4 uppercase letters
5. Duplicate codes are prevented
6. Changes are saved to `data/brands.json`

### Managing Users

1. Admin navigates to Admin Panel (`/admin`)
2. Selects "User Management" tab
3. Can add new users with email, name, password, and user type (Admin/Editor)
4. Can edit existing users (password optional when editing)
5. Email validation and duplicate checking enforced
6. Can delete users (with confirmation prompt)
7. Changes are saved to `data/users.json`

### Managing User Profile

1. User clicks profile dropdown in header
2. Selects "Edit Profile"
3. Navigates to `/profile`
4. Can update:
   - First name, last name, email
   - Profile image (JPEG, PNG, GIF, WebP, max 5MB)
   - Password (requires current password for verification)
5. Changes saved to `data/users.json`
6. Profile image saved to `public/uploads/profiles/`
7. Returns to dashboard after successful update

### Editing an ISCI Code

1. User clicks "Edit" on an existing code in the list
2. Navigates to `/edit/[ISCI-CODE]` (e.g., `/edit/LVCI2501`)
3. Form pre-fills with existing data
4. Brand is shown as disabled (cannot change brand)
5. Code can be edited if needed
6. Updates are saved with new `updatedAt` timestamp
7. Returns to dashboard (`/`) after saving or canceling

## Troubleshooting

### Dev Server Issues

If the dev server fails to start:
```bash
rm -rf .react-router node_modules/.vite
npm run dev
```

### Module Resolution Errors

- Ensure no `.js` or `.jsx` extensions in imports
- Check `vite.config.js` has correct extensions configured
- Verify `@/` alias is properly configured

### SCSS Import Errors

- Use `@use "@/styles/variables" as v;` not `@import`
- Access variables with namespace: `v.$variable-name`
- Ensure `vite.config.js` has correct `css.preprocessorOptions.scss.includePaths`

### Data Not Persisting

- Check `data/isci-codes.json` and `data/brands.json` exist and are writable
- Verify API endpoint is being called (check Network tab)
- Ensure file paths in route handlers are correct

### Auto-Generation Not Working

- Verify brand has a valid 4-letter code
- Check that `allCodes` prop is passed to ISCIForm
- Ensure brands are loaded properly from `/api/brands`
- Check browser console for errors in `generateISCICode()` function

### Duplicate ISCI Codes

If duplicate codes are generated:
- The algorithm searches all existing codes, so duplicates shouldn't occur
- If they do, check that `allCodes` prop contains all current codes
- Verify regex pattern in `generateISCICode()` is correct
- May need to add unique constraint when migrating to database

## Contact & Collaboration

This project is maintained for internal video editing workflow management. When working on this project:
- Follow existing patterns and conventions
- Keep code simple and maintainable
- Document significant changes
- Test thoroughly before committing
- Update this CLAUDE.md file when adding major features

---

**Last Updated**: January 6, 2025
**Version**: 3.3.0 - User Management & Authentication System

## Changelog

### v3.3.0 - User Management & Authentication System (January 6, 2025)
- Implemented user authentication system with login and session management
- Added UserManager component for admin user CRUD operations
- Created tabbed admin panel interface (Brand Management / User Management)
- Added user profile page with profile image upload and password change
- Created ProfileMenu dropdown component in header
- Added API endpoints for authentication (`/api/auth`), user management (`/api/users`), and profile updates (`/api/user`)
- Fixed SSR hydration issues in Header component
- Added default profile image fallback system
- Updated user data structure with `profileImage` and `profileUpdatedAt` fields
- Added session-based authentication with `app/utils/auth.js` helper functions
- Created 9 test users (1 admin, 8 editors)
- **Note**: Current auth is POC only - uses sessionStorage and plain-text passwords

### v3.2.0 - Grid Layout & Decoupled Edit Workflow (January 5, 2025)
- Refactored ISCIList from HTML table to CSS Grid layout
- Created dedicated EditISCI container and route (`/edit/:code`)
- Decoupled edit functionality from Dashboard component
- Changed URLs to use ISCI code instead of UUID for better readability
- Implemented sticky grid header with internal scrolling
- Updated color scheme and theme variables
- Enhanced Header component with profile section and navigation

### v3.1.0 - CSS Modules & Header Component (November 4, 2025)
- Converted all component styles to CSS Modules for scoped styling
- Enhanced Header component with flexible props

### v3.0.0 - Brand Management System (Previous)
- Implemented brand management and auto-generation system
- Added 100 test ISCI codes and 15 brands
