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
 * Get full name of current user
 */
export function getCurrentUserName() {
  const user = getUserSession();
  return user ? `${user.firstName} ${user.lastName}` : "";
}
