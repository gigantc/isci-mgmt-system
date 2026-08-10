/**
 * Routes Configuration
 *
 * This is the map of our app! 🗺️
 * It tells React Router which components to show for which URLs.
 *
 * Format: [pattern, file]
 *   - pattern: The URL path (like "/" or "/about")
 *   - file: Which file handles that route
 */

import { index, route } from "@react-router/dev/routes";

export default [
  // Login page
  route("login", "routes/login.jsx"),

  // Home page - shows the ISCIDashboard
  // index() means "the root path" (/)
  index("routes/home.jsx"),

  // Admin panel - manages brands/clients
  route("admin", "routes/admin.jsx"),

  // Reports page - data export/import
  route("reports", "routes/reports.jsx"),

  // User profile page
  route("profile", "routes/profile.jsx"),

  // Create ISCI code page
  route("create", "routes/create.jsx"),

  // Edit ISCI code page
  // :code parameter captures the ISCI code from the URL (e.g., LVCI2501)
  route("edit/:code", "routes/edit.jsx"),

  // Read-only Detail view for an ISCI code
  route("isci/:code", "routes/isci.jsx"),

  // API endpoint for authentication
  route("api/auth", "routes/api.auth.js"),

  // API endpoint for user profile updates
  route("api/user", "routes/api.user.js"),

  // API endpoint for tracking recently viewed items
  route("api/user/recently-viewed", "routes/api.user.recently-viewed.js"),

  // API endpoint for ISCI codes
  // Handles GET (load codes) and POST (save codes) requests
  route("api/isci", "routes/api.isci.js"),

  // API endpoint for ISCI import
  route("api/isci/import", "routes/api.isci.import.js"),

  // API endpoint for distinct languages used across ISCI codes
  route("api/isci/languages", "routes/api.isci.languages.js"),

  // API endpoint for brands
  // Handles GET (load brands) and POST (save brands) requests
  route("api/brands", "routes/api.brands.js"),

  // API endpoint for placements
  // Handles GET/POST/PUT/DELETE for placement records
  route("api/placements", "routes/api.placements.js"),

  // API endpoint for agencies
  // Handles GET (load agencies) and POST (save agencies) requests
  route("api/agencies", "routes/api.agencies.js"),

  // API endpoint for users
  // Handles GET (load users) and POST (save users) requests
  route("api/users", "routes/api.users.js"),
];
