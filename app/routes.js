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
  // Home page - shows the ISCIDashboard
  // index() means "the root path" (/)
  index("routes/home.jsx"),

  // Admin panel - manages brands/clients
  route("admin", "routes/admin.jsx"),

  // API endpoint for ISCI codes
  // Handles GET (load codes) and POST (save codes) requests
  route("api/isci", "routes/api.isci.js"),

  // API endpoint for brands
  // Handles GET (load brands) and POST (save brands) requests
  route("api/brands", "routes/api.brands.js"),
];
