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
│   │       └── index.js
│   ├── routes/                 # Route handlers
│   │   ├── admin.jsx           # Admin panel route (brands & users)
│   │   ├── login.jsx           # Login page route
│   │   ├── profile.jsx         # User profile page route
│   │   ├── reports.jsx         # Reports page route (import/export)
│   │   ├── create.jsx          # Create ISCI code route
│   │   ├── edit.jsx            # Edit ISCI code route
│   │   ├── home.jsx            # Home page route
│   │   ├── api.auth.js         # Authentication API endpoints
│   │   ├── api.user.js         # User profile update API
│   │   ├── api.user.recently-viewed.js  # Recently viewed tracking API
│   │   ├── api.users.js        # User management API endpoints
│   │   ├── api.brands.js       # Brand API endpoints
│   │   ├── api.isci.js         # ISCI code API endpoints
│   │   └── api.isci.import.js  # ISCI code CSV import API
│   ├── hooks/                   # Custom React hooks (reusable logic)
│   │   ├── index.js            # Centralized hook exports
│   │   ├── useFetchData.js     # Data fetching with loading/error states
│   │   ├── useFormState.js     # Form state management
│   │   ├── useResourceManager.js  # CRUD operations for manager components
│   │   ├── useExportData.js    # Export filtering and CSV generation
│   │   └── useImportData.js    # CSV import handling
│   ├── assets/                 # Global assets (shared across components)
│   │   ├── Logo.svg            # ISCIz logo
│   │   └── default_profile_image.jpg  # Default user profile image
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

### Role-Based Access Control

The system implements role-based access control with two user types:

**Admin Users:**
- Full access to all features
- Can view, create, edit, and delete ISCI codes
- Access to Admin panel (brand and user management)
- Access to Reports page (import/export)
- Can manage all users and brands

**Editor Users:**
- View-only access to ISCI codes
- Cannot edit or delete ISCI codes
- No access to Admin panel or Reports page
- Can view their assigned projects
- Cannot create new ISCI codes (admins only)

**Implementation:**
- Navigation links (Admin, Reports) are hidden for non-admins
- "Edit" buttons change to "View" for non-admins
- "Delete" buttons are completely hidden for non-admins
- Edit page becomes read-only view for non-admins (all form fields disabled)
- Page-level protection redirects non-admins attempting URL access
- "+ New ISCI Code" button only visible to admins

### Custom Hooks (Reusable Logic)

The application uses custom React hooks to eliminate code duplication and improve maintainability. All hooks are located in `app/hooks/` and exported from `app/hooks/index.js`.

**Import Pattern**:
```javascript
import { useFetchData, useResourceManager } from "@/hooks";
```

#### 1. useFetchData Hook
**Location**: `app/hooks/useFetchData.js`
**Purpose**: Eliminates duplicate fetch patterns across components

**Features**:
- Automatic data fetching on mount
- Loading and error state management
- Manual refetch capability
- Optional data filtering/transformation
- Configurable fetch behavior

**Usage Example**:
```javascript
// Simple fetch
const { data: brands, loading, refetch } = useFetchData("/api/brands");

// With filtering
const { data: activeBrands } = useFetchData("/api/brands", {
  filter: (data) => data.filter(b => b.active)
});
```

**Used By**: ISCIForm, Dashboard, Reports

---

#### 2. useResourceManager Hook
**Location**: `app/hooks/useResourceManager.js`
**Purpose**: Consolidates CRUD operations for manager components (Brand, User, Agency)

**Features**:
- Complete CRUD lifecycle (Create, Read, Update, Delete)
- Form state management with validation
- Toggle active/inactive status
- Smooth form animations (300ms)
- Custom item creation/update logic
- Automatic API integration

**Configuration Options**:
- `initialFormData`: Default form field values
- `validate`: Validation function (receives formData, items, editingItem)
- `createItem`: Custom item creation function
- `updateItem`: Custom item update function (optional)
- `hasActiveToggle`: Enable active/inactive toggle
- `onAfterSave`: Callback after successful save
- `onAfterDelete`: Callback after successful delete

**Usage Example**:
```javascript
const {
  items: brands,
  formData,
  errors,
  isLoading,
  showForm,
  handleChange,
  handleSubmit,
  handleEdit,
  handleDelete,
  handleToggleActive,
  handleNew,
  resetForm
} = useResourceManager("/api/brands", {
  initialFormData: { name: "", code: "" },
  validate: (data, brands, editingBrand) => {
    const errors = {};
    if (!data.name.trim()) errors.name = "Name required";
    if (!data.code.match(/^[A-Z]{4}$/)) errors.code = "Invalid code";
    return errors;
  },
  createItem: (data, now) => ({
    id: Date.now().toString(),
    name: data.name,
    code: data.code.toUpperCase(),
    active: true,
    createdAt: now,
    updatedAt: now,
  }),
  hasActiveToggle: true
});
```

**Used By**: BrandManager (293→82 lines), UserManager (353→100 lines), AgencyManager (341→130 lines)

---

#### 3. useExportData Hook
**Location**: `app/hooks/useExportData.js`
**Purpose**: Handle data export with filtering and CSV generation

**Features**:
- Filter state management
- Data filtering based on custom criteria
- CSV generation with proper escaping
- CSV file download
- Template download with example data
- Filter reset functionality

**Usage Example**:
```javascript
const {
  filters,
  filteredData,
  filteredCount,
  handleFilterChange,
  resetFilters,
  exportToCSV,
  downloadTemplate
} = useExportData(codes, {
  initialFilters: { status: "all", brand: "all" },
  filterFunction: (codes, filters) => codes.filter(...),
  csvHeaders: ["Code", "Brand", "Status"],
  csvRowMapper: (code) => [code.code, code.brand, code.status],
  filenamePrefix: "isci-codes"
});
```

**Used By**: Reports

---

#### 4. useImportData Hook
**Location**: `app/hooks/useImportData.js`
**Purpose**: Handle CSV file imports with preview and validation

**Features**:
- File upload handling (click & drag-drop)
- File preview generation (row count, size, headers)
- CSV import with multiple modes (add/update/replace)
- Import result handling
- Progress state management
- File type and size validation

**Usage Example**:
```javascript
const {
  file,
  preview,
  result,
  mode,
  isImporting,
  handleFileUpload,
  handleImport,
  setMode,
  clearFile
} = useImportData({
  endpoint: "/api/isci/import",
  defaultMode: "add",
  onSuccess: (result) => {
    console.log("Import successful", result);
    loadData();
  }
});
```

**Used By**: Reports

---

#### 5. useFormState Hook
**Location**: `app/hooks/useFormState.js`
**Purpose**: Centralized form state management with validation

**Features**:
- Form data state management
- Individual and bulk field updates
- Form reset functionality
- Error state management
- Validation support
- Submit handling
- Support for both event objects and direct values

**Usage Example**:
```javascript
const {
  formData,
  errors,
  isSubmitting,
  handleChange,
  handleSubmit,
  resetForm
} = useFormState({
  name: "",
  email: ""
}, {
  validate: (data) => {
    const errors = {};
    if (!data.email) errors.email = "Email required";
    return errors;
  },
  onSubmit: async (data) => {
    await saveData(data);
  }
});
```

**Status**: Created but not yet used (Profile component has unique FormData requirements)

---

### Import/Export System

**Location**: `/reports` page (admin-only)

**Export Features:**
- Advanced filtering by date (created/updated/air), status, editor, brand, channel, spot length
- CSV export with all ISCI code fields
- Shows filtered count before export
- One-click filter reset

**Import Features:**
- CSV template download with example data
- Three import modes:
  - **Add New**: Import only codes that don't exist (skips duplicates)
  - **Update Existing**: Update codes that match by ISCI code
  - **Replace All**: Delete all existing codes and import new set (⚠️ Warning shown)
- File upload with drag/drop support
- Preview showing file details before import
- Row-by-row validation
- Detailed success/error reporting
- Required fields: ISCI Code, Brand, Spot Title

**CSV Format:**
```csv
ISCI Code,Brand,Campaign Name,Spot Title,Spot Length,Assigned Editor,Status,Channel,Aspect Ratio,Version,Language,Closed Captioning,Audio,Air Date,Description
```

**API Endpoint**: `POST /api/isci/import`
- Handler: `app/routes/api.isci.import.js`
- Request: `{ csvData: string, importMode: "add" | "update" | "replace" }`
- Response: `{ success: boolean, message: string, errors?: array }`

### Brand/Client Management

Brands are managed separately from ISCI codes to enable code auto-generation.

**Brand Data Structure**:
```javascript
{
  id: string,              // UUID
  name: string,            // Full brand/client name (required)
  abbreviation: string,    // Brand abbreviation (optional, e.g., "LVCVA")
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
- Examples: `LVCR`, `NIKE`, `APPL`, `COCA`, `TOYT`

**Example**:
- Name: "Las Vegas Convention and Visitors Authority"
- Abbreviation: "LVCVA"
- Code: "LVCR"

**Storage**: Prisma database (Brand model)

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

- **`/` (Home)**: Main dashboard with ISCI code list and search functionality
  - Handler: `app/routes/home.jsx`
  - Component: `Dashboard` container
  - Features:
    - List view with search functionality
    - "+ New ISCI Code" button in search bar (admin only)
    - Three dashboard boxes: Recently Viewed, Assigned Projects, Recently Created
    - "Edit" buttons for admins, "View" buttons for editors
    - "Delete" buttons hidden for editors

- **`/create` (Create ISCI Code)**: Create new ISCI code page (protected, admin-only)
  - Handler: `app/routes/create.jsx`
  - Component: `CreateISCI` container
  - Features: Form with auto-generated ISCI code based on brand selection
  - Protected: Admin only

- **`/edit/:code` (Edit/View ISCI Code)**: View or edit a specific ISCI code (protected)
  - Handler: `app/routes/edit.jsx`
  - Component: `EditISCI` container
  - URL Parameter: `:code` - The ISCI code (e.g., `/edit/LVCI2501`)
  - Features:
    - Admins: Full edit capabilities with "Update ISCI" button
    - Editors: Read-only view with all form fields disabled
    - Page title changes based on role: "Edit ISCI Code" vs "View ISCI Code"
    - Button changes based on role: "Cancel" vs "Back"
  - Protected: Requires authentication

- **`/login` (Login)**: User authentication page
  - Handler: `app/routes/login.jsx`
  - Features: Email/password login, session creation

- **`/profile` (User Profile)**: User profile management page (protected)
  - Handler: `app/routes/profile.jsx`
  - Component: `Profile` container
  - Features: Edit name, email, password, upload profile image
  - Protected: Requires authentication

- **`/reports` (Reports)**: Import/export data management page (protected, admin-only)
  - Handler: `app/routes/reports.jsx`
  - Features:
    - Export tab: Advanced filtering and CSV export
    - Import tab: CSV import with three modes (add/update/replace)
    - Template download
  - Protected: Admin only (redirects editors to home)

- **`/admin` (Admin Panel)**: Brand and user management interface (protected, admin-only)
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

**POST /api/isci/import**
- Imports ISCI codes from CSV data
- Handler: `app/routes/api.isci.import.js` - `action()` function
- Request Body: `{ csvData: string, importMode: "add" | "update" | "replace" }`
- Response: `{ success: boolean, message: string, errors?: array, skipped?: number }`
- Import modes:
  - `add`: Import only new codes (skips existing)
  - `update`: Update existing codes by matching ISCI code
  - `replace`: Delete all and import new set
- Validates required fields: Code, Brand, Spot Title
- Returns row-by-row error details

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

**POST /api/user/recently-viewed**
- Tracks recently viewed ISCI codes for a user
- Handler: `app/routes/api.user.recently-viewed.js` - `action()` function
- Request Body: `{ userId: string, isciCode: string }`
- Maintains a list of last 5 viewed codes per user
- Updates user session in sessionStorage
- Used by: EditISCI container to track viewed codes

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
- `.btn-danger` - Dangerous action button (red background, for delete operations)
- `.btn-text` - Text-only button (transparent background, uppercase)

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
- [x] User authentication and authorization ✅ (v0.4.0-alpha)
- [x] Multi-user collaboration ✅ (v0.4.0-alpha - multi-user support)
- [ ] File attachments for ISCI codes
- [x] Export to CSV/Excel ✅ (v0.5.0-alpha - CSV export with filtering)
- [x] Advanced filtering and sorting by brand, status, date ✅ (v0.5.0-alpha - export filtering)
- [x] Import from CSV/Excel ✅ (v0.5.0-alpha - CSV import with 3 modes)
- [ ] Dashboard analytics and reporting (partially complete - Recently Created section)
- [ ] Activity logs and audit trail
- [ ] Email notifications for due dates
- [ ] Batch operations (bulk edit/delete)
- [ ] Brand usage statistics and reporting
- [ ] Automatic year rollover handling
- [ ] Exportable Slate feature (1920x1080 JPG with ISCI code details)

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

11. **Form Behavior**: ISCIForm behaves differently in create vs edit vs view mode:
    - **Create**: Brand dropdown shown, code field is read-only and auto-generated
    - **Edit (Admin)**: Brand shown as disabled text (can't change), code field is editable, all fields enabled
    - **View (Editor)**: All fields disabled (viewOnly mode), "Update" button hidden

12. **Header Component**: The Header automatically determines navigation visibility based on user role using `isAdmin()`. No props needed. Navigation shows Dashboard for all users, and Admin/Reports for admin users only. Uses lazy state initializer to prevent profile image flash.

13. **Navigation States**: Active navigation links show with orange color and 3px bottom border. Dashboard link only active on root path `/`. Clicking active nav items is prevented.

14. **Button Location**: The "+ New ISCI Code" button is located in the dashboard search bar (not in header). Only visible to admin users.

15. **CSS Grid Layout**: ISCIList uses CSS Grid instead of HTML tables for better flexibility and modern styling. The grid header uses `position: sticky` for a fixed header while content scrolls.

16. **Edit Workflow**: Edit functionality is decoupled from Dashboard - it has its own route (`/edit/:code`) and container (`EditISCI`). Page title and buttons change based on user role (Edit vs View).

17. **URL Structure**: ISCI codes are used in URLs instead of UUIDs (e.g., `/edit/LVCI2501`). This makes URLs more readable and shareable.

18. **SSR Hydration**: The Header uses lazy state initializer (`useState(() => {...})`) to load user session immediately on mount, preventing flash of default profile image during navigation.

19. **ProfileMenu Component**: Dropdown menu in header provides access to "Edit Profile" and "Logout" actions. Uses click-outside detection to auto-close.

20. **User Management Access**: Only admins can access the User Management tab in the admin panel. The tab interface makes it easy to switch between Brand and User management.

21. **Role-Based UI**: The UI adapts based on user role:
    - Admins see: Edit buttons, Delete buttons, Create button, Admin/Reports nav
    - Editors see: View buttons, no Delete buttons, no Create button, Dashboard nav only
    - All form fields disabled in view mode for editors

22. **Recently Viewed Tracking**: The EditISCI container automatically tracks viewed codes and updates the user's recentlyViewed list (max 5 codes) via the `/api/user/recently-viewed` endpoint.

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

## Production Deployment

The ISCI Management System is deployed on AWS EC2 and accessible via HTTP.

### Deployment Environment

- **Platform**: AWS EC2 (Ubuntu 24.04 LTS)
- **Live URL**: http://54.158.87.192
- **Node.js**: v20.20.0
- **Process Manager**: PM2 (with auto-restart on crashes and server reboot)
- **Web Server**: Nginx (reverse proxy on port 80)
- **Application Directory**: `/var/www/isci-mgmt-system`

### Deployment Files

The repository includes complete deployment configuration:

1. **ecosystem.config.cjs** - PM2 process manager configuration
   - **Important**: Uses `.cjs` extension for CommonJS compatibility (package.json has `"type": "module"`)
   - Runs `npm start` (react-router-serve) instead of directly running build file
   - React Router v7 requires `react-router-serve` to properly start the SSR server
   - Configured for fork mode (not cluster) with auto-restart
   - Logs to `/var/www/isci-mgmt-system/logs/`

2. **nginx.conf** - Nginx reverse proxy configuration
   - Proxies requests from port 80 to Node.js app on port 3000
   - Serves static assets directly (build/client/assets/, uploads/)
   - Includes gzip compression, security headers, and WebSocket support
   - **Note**: Contains placeholder `yourdomain.com` - replace before SSL setup

3. **deploy.sh** - Automated deployment script
   - Pulls latest code from GitHub
   - Installs dependencies with `npm install --omit=dev`
   - Backs up data files before deployment
   - Builds application
   - Restarts PM2 process
   - Cleans up old backups (7+ days)

4. **AWS_EC2_DEPLOYMENT.md** - Complete deployment guide
   - Step-by-step instructions for EC2 setup
   - Security configuration, SSL setup (Let's Encrypt), backup strategies
   - Tested on Ubuntu 24.04 LTS

5. **AWS_QUICK_REFERENCE.md** - Quick command reference for daily operations

6. **.env.example** - Environment configuration template

### PM2 Commands (On Server)

```bash
# View application status
pm2 status

# View logs (live)
pm2 logs isci-mgmt

# View last 50 log lines
pm2 logs isci-mgmt --lines 50

# Restart application
pm2 restart isci-mgmt

# Stop application
pm2 stop isci-mgmt

# Monitor resources
pm2 monit
```

### Deployment Workflow

**Initial Deployment**: Follow AWS_EC2_DEPLOYMENT.md completely

**Updating Application**:
1. Push changes to GitHub
2. SSH into server: `ssh -i key.pem ubuntu@54.158.87.192`
3. Run deployment script: `cd /var/www/isci-mgmt-system && ./deploy.sh`
4. Verify: `pm2 status` and `pm2 logs isci-mgmt`

### Important Deployment Notes

1. **React Router v7 Requirement**: The app uses `npm start` (react-router-serve) instead of running the build file directly with node. Running `node build/server/index.js` will start the server but it exits immediately without output. Always use PM2 with the ecosystem.config.cjs file.

2. **File Extension**: `ecosystem.config.cjs` uses CommonJS syntax because package.json has `"type": "module"`. Do not rename to `.js` or it will fail to load.

3. **Data Persistence**: JSON files in `data/` directory are persisted on the server. Profile images are stored in `public/uploads/profiles/`.

4. **Logs**: PM2 logs are written to `/var/www/isci-mgmt-system/logs/` and are excluded from git via `.gitignore`.

5. **SSL/HTTPS**: Not yet configured. When ready, update nginx.conf with domain name and follow Let's Encrypt setup in AWS_EC2_DEPLOYMENT.md Step 7.

6. **Security**: Security groups should allow SSH (port 22) from your IP only, and HTTP (port 80) from anywhere. HTTPS (port 443) will be needed when SSL is configured.

### Server Management

```bash
# SSH into server
ssh -i /path/to/key.pem ubuntu@54.158.87.192

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx config
sudo systemctl reload nginx

# Check disk space
df -h

# Check memory
free -h

# View Nginx logs
sudo tail -f /var/log/nginx/isci-mgmt-access.log
sudo tail -f /var/log/nginx/isci-mgmt-error.log
```

### Troubleshooting Production Issues

**502 Bad Gateway**: App not running or not listening on port 3000
```bash
pm2 status                    # Check if online
pm2 logs isci-mgmt --err      # Check error logs
sudo lsof -i :3000            # Check if port is listening
curl http://localhost:3000    # Test local connection
pm2 restart isci-mgmt         # Restart if needed
```

**App Crashes on Start**: Check PM2 error logs
```bash
pm2 logs isci-mgmt --err --lines 100
```

**Out of Memory**: Restart app to free memory
```bash
free -h                       # Check memory usage
pm2 restart isci-mgmt         # Restart app
```

**Deployment Script Fails**: Check git permissions and build process
```bash
git status                    # Check for uncommitted changes
npm install                   # Try manual install
npm run build                 # Try manual build
```

## Contact & Collaboration

This project is maintained for internal video editing workflow management. When working on this project:
- Follow existing patterns and conventions
- Keep code simple and maintainable
- Document significant changes
- Test thoroughly before committing
- Update this CLAUDE.md file when adding major features

---

**Last Updated**: January 23, 2026
**Version**: 0.9.1-alpha - Database Migration & Quick Wins

## Changelog

### v0.9.1-alpha - Database Migration & UX Improvements (January 23, 2026)
- **Database Migration**: Migrated from JSON file storage to Prisma + SQLite/PostgreSQL
  - Added Prisma ORM with SQLite for local development
  - Created database models: User, Brand, Agency, ISCICode
  - Refactored all API routes to use Prisma instead of JSON files
  - Created data migration script for JSON to database
- **RESTful API Refactoring**: Converted from "delete all, recreate all" to proper CRUD
  - All API routes now support individual POST (create), PUT (update), DELETE operations
  - Fixed data loss issues when updating agencies and users
  - Updated useResourceManager hook to use new API pattern
  - Updated CreateISCI, EditISCI, Dashboard containers for new API
- **Client Data Model Updates**:
  - Added `abbreviation` field to Brand model (e.g., "LVCVA" for Las Vegas Convention and Visitors Authority)
  - Updated BrandManager component with abbreviation field in forms and tables
  - Changed UI terminology from "Brand" to "Client" throughout BrandManager
- **Custom Confirmation Dialogs**: Replaced browser alerts with styled confirmation dialogs
  - Created ConfirmDialog component with dark mode theme styling
  - Created useConfirmDialog hook with Promise-based API
  - Added `btn-danger` global button class for delete actions
  - Updated all deletion flows: Dashboard (ISCI codes), BrandManager, UserManager, AgencyManager
  - Updated useResourceManager hook to support custom confirmDelete function
- **New Files**:
  - `app/components/ConfirmDialog/` - Custom confirmation dialog component
  - `app/hooks/useConfirmDialog.js` - Confirmation dialog state management hook
  - `app/utils/api.js` - API error handling utilities
  - `app/components/ErrorBoundary/` - React Error Boundary component
  - `prisma/schema.prisma` - Database schema
  - `app/lib/prisma.js` - Prisma client instance
  - `scripts/migrateJsonToDb.js` - Data migration script

### v0.8.0-alpha - Production Deployment (January 22, 2026)
- **AWS EC2 Deployment**: Successfully deployed to production on Ubuntu 24.04 LTS
  - Live at: http://54.158.87.192
  - Node.js v20.20.0, PM2 process manager, Nginx reverse proxy
- **Deployment Configuration**:
  - Fixed `ecosystem.config.js` → `ecosystem.config.cjs` for ES module compatibility
  - Updated to use `npm start` (react-router-serve) instead of direct node execution
  - Fixed deprecated `npm --production` flag → `npm install --omit=dev`
  - Created `.env.example` template file
  - Added TODO comments to nginx.conf for domain placeholders
- **Documentation**:
  - Created comprehensive deployment guides (AWS_EC2_DEPLOYMENT.md, AWS_QUICK_REFERENCE.md)
  - Added Production Deployment section to CLAUDE.md
  - Updated README.md with live demo link and deployment info
  - Created DEPLOYMENT_FILES_README.md overview
- **PM2 Configuration**: Auto-start on server reboot, automatic crash recovery
- **Next Steps**: SSL/HTTPS setup (Let's Encrypt), automated backups to S3

### v0.7.0-alpha - Phase 1 Refactoring: Custom Hooks (November 14, 2025)
- **Major Codebase Refactoring**: Improved maintainability, reusability, and testability
  - Created 5 custom hooks (993 lines of reusable code)
  - Refactored 6 components (1,074 lines removed, 43% reduction)
  - Eliminated 80% code duplication in manager components
- **Custom Hooks Created**:
  - `useFetchData`: Eliminates duplicate fetch patterns (97 lines)
  - `useFormState`: Centralized form state management (170 lines)
  - `useResourceManager`: Consolidates CRUD operations for managers (298 lines)
  - `useExportData`: Export filtering and CSV generation (208 lines)
  - `useImportData`: CSV file import handling (220 lines)
- **Components Refactored**:
  - BrandManager: 293 → 82 lines (72% reduction)
  - UserManager: 353 → 100 lines (72% reduction)
  - AgencyManager: 341 → 130 lines (62% reduction)
  - ISCIForm: Replaced duplicate fetch logic with useFetchData
  - Dashboard: Replaced loadCodes with useFetchData
  - Reports: 584 → 250 lines (57% reduction) using useExportData + useImportData
- **Documentation**:
  - Added comprehensive Custom Hooks section to CLAUDE.md
  - Created REFACTORING_ANALYSIS.md (initial analysis)
  - Created REFACTORING_SUMMARY.md (complete metrics and impact)
  - Created REFACTORING_TEST_RESULTS.md (testing checklist)
- **Impact**: Better organized, more maintainable, and easily testable codebase

### v0.6.0-alpha - Admin Panel Enhancements & Sorting (November 13, 2025)
- **ISCIList Sorting**: Added clickable column headers with ascending/descending sort functionality
  - All columns sortable: ISCI Code, Editor, Brand, Campaign, Spot Title, Length, Air Date, Status
  - Visual indicators (▲/▼) show active sort column and direction
  - Hover effects on sortable headers for better UX
  - Alphabetical, numeric, and date-based sorting supported
- **Admin Panel UX Improvements**:
  - Added X close button in top-right corner of all form panels (Brand, User, Agency)
  - Cancel button now always visible (not just when editing)
  - Smooth closing animations matching the opening animations (300ms slideUp)
  - Consistent form header styling across all three management sections
- **Sticky Headers & Scroll Containers**:
  - List section headers ("All Brands", "All Users", "All Agencies") remain visible when scrolling
  - Table column headers stay fixed at top while scrolling through data
  - Table areas limited to 600px height with internal scrolling
  - Prevents entire page from scrolling, improves navigation
- **Agency Management Standardization**:
  - Standardized header spacing and colors to match Brand/User management
  - Moved "Set as Default Agency" checkbox below Agency Name field
  - Added proper spacing between form elements
  - Consistent sticky behavior and scroll containers



### v0.5.0-alpha - Role-Based Access Control & Import/Export System (November 6, 2025)
- **Import/Export System**: Added comprehensive CSV import/export functionality on `/reports` page
  - Export with advanced filtering (date, status, editor, brand, channel, spot length)
  - Import with three modes: add new, update existing, replace all
  - CSV template download with example data
  - Row-by-row validation and error reporting
  - Added `POST /api/isci/import` endpoint
- **Role-Based Access Control**: Implemented comprehensive admin/editor permission system
  - Admins: Full access to create, edit, delete ISCI codes
  - Editors: View-only access with all form fields disabled
  - Navigation links (Admin, Reports) hidden for non-admins
  - "Edit" buttons change to "View" for editors
  - "Delete" buttons completely hidden for editors
  - Page-level protection with redirects for unauthorized access
- **UI/UX Improvements**:
  - Moved "+ New ISCI Code" button from header to dashboard search bar
  - Added active navigation states with orange underline (3px bottom border)
  - Fixed profile image flash on navigation using lazy state initializer
  - Dashboard link only active on root path (not on /create or /edit)
- **Dashboard Enhancements**:
  - Added "Recently Created" section showing 5 most recent codes
  - "Recently Viewed" and "Assigned Projects" boxes show appropriate buttons based on role
- **Recently Viewed Tracking**: Added `POST /api/user/recently-viewed` endpoint to track viewed codes
- **Header Component**: Simplified to automatically determine navigation based on user role (no props needed)
- **ISCIForm viewOnly Mode**: Added read-only mode for non-admin users viewing ISCI codes

### v0.4.0-alpha - User Management & Authentication System (January 6, 2025)
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

### v0.3.0-alpha - Grid Layout & Decoupled Edit Workflow (January 5, 2025)
- Refactored ISCIList from HTML table to CSS Grid layout
- Created dedicated EditISCI container and route (`/edit/:code`)
- Decoupled edit functionality from Dashboard component
- Changed URLs to use ISCI code instead of UUID for better readability
- Implemented sticky grid header with internal scrolling
- Updated color scheme and theme variables
- Enhanced Header component with profile section and navigation

### v0.2.0-alpha - CSS Modules & Header Component (November 4, 2025)
- Converted all component styles to CSS Modules for scoped styling
- Enhanced Header component with flexible props

### v0.1.0-alpha - Brand Management System (Previous)
- Implemented brand management and auto-generation system
- Added 100 test ISCI codes and 15 brands
