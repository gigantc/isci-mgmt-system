/**
 * UUID Generation Utility
 *
 * Generates UUIDs with fallback for browsers that don't support crypto.randomUUID()
 * (e.g., older browsers or HTTP contexts)
 */

/**
 * Generates a v4 UUID
 * Uses crypto.randomUUID() if available, otherwise falls back to Math.random()
 */
export function generateUUID() {
  // Try native crypto.randomUUID() first (most secure)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch (err) {
      console.warn("crypto.randomUUID() failed, using fallback", err);
    }
  }

  // Fallback: Generate UUID v4 using Math.random()
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
