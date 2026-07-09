/**
 * Authentication Utilities
 *
 * Simple session management using sessionStorage
 * WARNING: This is a POC - not production ready!
 */

const SESSION_KEY = "isci_user";

/**
 * Save user to session
 */
export function saveUserSession(user) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

/**
 * Get current user from session
 */
export function getUserSession() {
  if (typeof window !== "undefined") {
    const userData = sessionStorage.getItem(SESSION_KEY);
    return userData ? JSON.parse(userData) : null;
  }
  return null;
}

/**
 * Clear user session (logout)
 */
export function clearUserSession() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Check if user is logged in
 */
export function isAuthenticated() {
  return getUserSession() !== null;
}

/**
 * Check if user is admin
 */
export function isAdmin() {
  const user = getUserSession();
  return user && user.userType === "admin";
}

/**
 * Check if user is a Viewer (read-only, no create/edit/admin/reports access).
 */
export function isViewer() {
  const user = getUserSession();
  return user && user.userType === "viewer";
}

/**
 * Check if user can create/edit ISCI codes (admins and editors).
 * Note: delete stays admin-only — use isAdmin() for that.
 */
export function canEdit() {
  const user = getUserSession();
  return user && (user.userType === "admin" || user.userType === "editor");
}

/**
 * Human-readable label for the current user's role.
 */
export function getUserRoleLabel(user) {
  const u = user ?? getUserSession();
  if (!u) return "Guest";
  if (u.userType === "admin") return "Admin";
  if (u.userType === "viewer") return "Viewer";
  return "Editor";
}

/**
 * Get full name of current user
 */
export function getCurrentUserName() {
  const user = getUserSession();
  return user ? `${user.firstName} ${user.lastName}` : "";
}
