# Changelog

All notable changes to the ISCI Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.1-alpha] - 2026-01-23

### Database Migration & UX Improvements

#### Added
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

#### New Files
- `app/components/ConfirmDialog/` - Custom confirmation dialog component
- `app/hooks/useConfirmDialog.js` - Confirmation dialog state management hook
- `app/utils/api.js` - API error handling utilities
- `app/components/ErrorBoundary/` - React Error Boundary component
- `prisma/schema.prisma` - Database schema
- `app/lib/prisma.js` - Prisma client instance
- `scripts/migrateJsonToDb.js` - Data migration script

---

## [0.8.0-alpha] - 2026-01-22

### Production Deployment

#### Added
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

#### Planned
- SSL/HTTPS setup (Let's Encrypt)
- Automated backups to S3

---

## [0.7.0-alpha] - 2025-11-14

### Phase 1 Refactoring: Custom Hooks

#### Added
- **Major Codebase Refactoring**: Improved maintainability, reusability, and testability
  - Created 5 custom hooks (993 lines of reusable code)
  - Refactored 6 components (1,074 lines removed, 43% reduction)
  - Eliminated 80% code duplication in manager components

#### Custom Hooks Created
- `useFetchData`: Eliminates duplicate fetch patterns (97 lines)
- `useFormState`: Centralized form state management (170 lines)
- `useResourceManager`: Consolidates CRUD operations for managers (298 lines)
- `useExportData`: Export filtering and CSV generation (208 lines)
- `useImportData`: CSV file import handling (220 lines)

#### Components Refactored
- BrandManager: 293 → 82 lines (72% reduction)
- UserManager: 353 → 100 lines (72% reduction)
- AgencyManager: 341 → 130 lines (62% reduction)
- ISCIForm: Replaced duplicate fetch logic with useFetchData
- Dashboard: Replaced loadCodes with useFetchData
- Reports: 584 → 250 lines (57% reduction) using useExportData + useImportData

#### Documentation
- Added comprehensive Custom Hooks section to CLAUDE.md
- Created REFACTORING_ANALYSIS.md (initial analysis)
- Created REFACTORING_SUMMARY.md (complete metrics and impact)
- Created REFACTORING_TEST_RESULTS.md (testing checklist)

---

## [0.6.0-alpha] - 2025-11-13

### Admin Panel Enhancements & Sorting

#### Added
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

---

## [0.5.0-alpha] - 2025-11-06

### Role-Based Access Control & Import/Export System

#### Added
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

---

## [0.4.0-alpha] - 2025-01-06

### User Management & Authentication System

#### Added
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

#### Security Note
⚠️ Current auth is POC only - uses sessionStorage and plain-text passwords

---

## [0.3.0-alpha] - 2025-01-05

### Grid Layout & Decoupled Edit Workflow

#### Changed
- Refactored ISCIList from HTML table to CSS Grid layout
- Created dedicated EditISCI container and route (`/edit/:code`)
- Decoupled edit functionality from Dashboard component
- Changed URLs to use ISCI code instead of UUID for better readability
- Implemented sticky grid header with internal scrolling
- Updated color scheme and theme variables
- Enhanced Header component with profile section and navigation

---

## [0.2.0-alpha] - 2025-11-04

### CSS Modules & Header Component

#### Changed
- Converted all component styles to CSS Modules for scoped styling
- Enhanced Header component with flexible props

---

## [0.1.0-alpha] - 2025-10-01

### Brand Management System

#### Added
- Implemented brand management and auto-generation system
- Added 100 test ISCI codes and 15 brands
- Created ISCI code auto-generation algorithm
- Implemented brand code validation (4 uppercase letters)
- Created initial dashboard and list views
