# Code Audit — April 13, 2026

Full codebase review of routes, components, hooks, styles, and config.

---

## Critical

### 1. No server-side auth on any API endpoint
**Files:** All `app/routes/api.*.js`
Every API route is unprotected. Client-side sessionStorage checks are trivially bypassed — anyone can POST/PUT/DELETE brands, users, ISCI codes directly.

### 2. Plain-text passwords
**Files:** `api.auth.js:28-29`, `api.user.js:39,105`, `api.users.js:64,112`, `prisma/schema.prisma:16`
Passwords stored and compared as-is. Full account compromise if the DB leaks.

### 3. Prisma singleton is backwards
**File:** `app/lib/prisma.js:7-8`
Only caches the PrismaClient in development. In production, every import creates a new connection — will exhaust the pool under load. Fix: reverse the condition or cache in both environments.

### 4. User profile endpoint has no ownership check
**File:** `app/routes/api.user.js:18`
Accepts any `id` via FormData. Anyone can update anyone's profile by passing a different ID.

---

## Important

### 5. No input validation on APIs
**Files:** All `app/routes/api.*.js`
No email format checks, no string length limits, no enum validation for status/channel/language. CSV import (`api.isci.import.js:16-56`) parses raw user input with no structure validation.

### 6. No CSRF protection
No tokens on forms or API calls. Cross-site request forgery attacks possible on all mutating endpoints.

### 7. No rate limiting on login
**File:** `app/routes/api.auth.js`
Brute force attacks have no throttling.

### 8. Race conditions in hooks
- `app/hooks/useFetchData.js:69-107` — no AbortController cleanup on unmount; stale closures if endpoint changes mid-fetch.
- `app/hooks/useResourceManager.js:340-374` — optimistic delete updates UI before API confirms; if API fails, UI is out of sync.

### 9. Transaction gaps in CSV import
**File:** `app/routes/api.isci.import.js:154-176`
"Replace" mode uses a transaction, but "add" and "update" modes don't. A failure mid-batch leaves partial data.

### 10. File upload vulnerabilities
**File:** `app/routes/api.user.js:64-96`
Extension parsed with `.split(".").pop()` (vulnerable to edge cases), MIME-only type check (spoofable), no size enforcement after parse, predictable filenames.

### 11. Missing `onDelete` rules in Prisma schema
**File:** `prisma/schema.prisma:48-75`
ISCICode → Brand relation has no `onDelete` constraint. Brand deletion is only enforced at app level, not DB level.

### 12. Hardcoded demo credentials in Login UI
**File:** `app/containers/Login/Login.jsx:108-112`
Demo credentials visible in page source.

---

## Quality & Maintainability

### 13. No ESLint, Prettier, or tests
No linting, formatting, or test framework configured. No `lint`, `format`, or `test` scripts in `package.json`.

### 14. Responsive gaps
**File:** `app/components/ISCIList/ISCIList.module.scss:14`
Table has `min-width: 1260px` with no mobile fallback. Key tables don't scroll properly on small screens.

### 15. Accessibility holes
- `ConfirmDialog` — missing `role="dialog"`, `aria-modal`, `aria-labelledby`.
- `ISCIList` — div-based table structure instead of semantic `<table>` elements.
- No `@media (prefers-reduced-motion: reduce)` on any animation.
- Missing `:focus` states on ProfileMenu button, Dashboard "Create New" button, and others.

### 16. SCSS inconsistencies
- Hardcoded `max-height: 600px` in BrandManager, UserManager, AgencyManager.
- `calc(100% - 2rem)` repeated 6+ times across pages.
- Raw RGBA colors (e.g., `rgba(255, 250, 231, 0.05)`) instead of variables in ConfirmDialog, EditISCI.
- No centralized z-index scale (values range from 5 to 2000).
- No spacing scale defined.
- Header uses `1cap` unit (`Header.module.scss:9`) — likely a typo for `1rem`.

### 17. Vite config missing optimizations
**File:** `vite.config.js`
No `manualChunks` for chunk splitting, no source map controls for production, no `ssr.noExternal` for Prisma.

### 18. Dependency drift
React Router 5 minor versions behind (7.9 → 7.14), Prisma major version available (6 → 7), Sass and Vite also behind.

### 19. No error feedback to users
Errors go to `console.error` across Dashboard, CreateISCI, EditISCI — nothing shows in the UI. No toast/notification system.

### 20. CSV export formula injection
**File:** `app/hooks/useExportData.js:119-126`
Values starting with `=`, `@`, `+`, `-` could execute as formulas when opened in Excel.

### 21. No audit logging
No trail for who created/updated/deleted what. Can't trace admin actions.

### 22. API code duplication
**Files:** `api.brands.js`, `api.agencies.js`, `api.users.js`, `api.isci.js`
Nearly identical CRUD patterns across all routes. Could use a shared factory.

### 23. Inconsistent error response formats
**File:** `app/routes/api.user.recently-viewed.js:9,18,44`
Returns plain objects instead of `Response.json()` with proper HTTP status codes.

---

## Recommended Order of Work

| # | Change | Effort | Impact |
|---|--------|--------|--------|
| 1 | Fix Prisma singleton (`prisma.js:7-8`) | 5 min | Prevents production connection exhaustion |
| 2 | Server-side auth middleware for all API routes | Large | Nothing else matters without it |
| 3 | Password hashing with bcrypt | Medium | Bare minimum security |
| 4 | Input validation layer across APIs | Medium | Protects data integrity |
| 5 | Add ESLint + Prettier config | Small | Foundation for code quality |
| 6 | Error toast/notification system | Medium | Users currently get zero feedback on failures |
| 7 | Accessibility pass (semantic HTML, ARIA, focus, reduced motion) | Medium | Usability for all users |
| 8 | SCSS cleanup (variables, z-index scale, spacing scale) | Small | Maintainability |
| 9 | AbortController in useFetchData + transaction safety in import | Small | Fixes race conditions |
| 10 | Responsive table solution | Small | Mobile usability |
