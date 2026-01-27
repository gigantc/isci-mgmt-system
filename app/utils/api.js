/**
 * API Utilities
 *
 * Common utilities for API routes including error handling,
 * response formatting, and validation helpers.
 */

/**
 * Standard API error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} JSON response
 */
export function apiError(message, status = 500) {
  return Response.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Standard API success response
 * @param {object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} JSON response
 */
export function apiSuccess(data = {}, status = 200) {
  return Response.json(
    { success: true, ...data },
    { status }
  );
}

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} context - Context for logging (e.g., "brands", "users")
 * @returns {Response} JSON error response
 */
export function handleApiError(error, context = "API") {
  console.error(`[${context}] Error:`, error.message);

  // Handle Prisma-specific errors
  if (error.code === "P2002") {
    return apiError("A record with this value already exists", 400);
  }
  if (error.code === "P2025") {
    return apiError("Record not found", 404);
  }

  return apiError(error.message || "An unexpected error occurred", 500);
}

/**
 * Validate required fields in request data
 * @param {object} data - The data to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(data, requiredFields) {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return `${field} is required`;
    }
  }
  return null;
}

/**
 * Parse and validate integer from string or number
 * @param {string|number} value - Value to parse
 * @param {number|null} defaultValue - Default if empty/invalid
 * @returns {number|null} Parsed integer or default
 */
export function parseIntOrNull(value, defaultValue = null) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parse JSON string to array
 * @param {string} jsonString - JSON string to parse
 * @param {array} defaultValue - Default value if parsing fails
 * @returns {array} Parsed array or default
 */
export function parseJsonArray(jsonString, defaultValue = []) {
  try {
    const parsed = JSON.parse(jsonString || "[]");
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}
