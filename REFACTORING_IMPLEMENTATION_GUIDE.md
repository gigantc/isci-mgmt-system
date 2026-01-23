# Refactoring Implementation Guide - Code Examples

**Generated:** January 23, 2026
**Purpose:** Ready-to-use code for implementing refactoring changes

---

## Phase 1: Critical Security & Stability

### 1. Error Boundary Component

**File:** `/app/components/ErrorBoundary/ErrorBoundary.jsx` (NEW)

```javascript
import React from "react";
import styles from "./ErrorBoundary.module.scss";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <h1>Oops! Something went wrong</h1>
            <p className={styles.errorMessage}>
              {this.state.error && this.state.error.toString()}
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className={styles.actions}>
              <button onClick={this.handleReset} className={styles.btnRetry}>
                Try Again
              </button>
              <button onClick={() => window.location.href = "/"} className={styles.btnHome}>
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**File:** `/app/components/ErrorBoundary/ErrorBoundary.module.scss` (NEW)

```scss
@use "@/styles/variables" as v;

.errorBoundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: v.$black;
  padding: 2rem;
}

.errorContainer {
  background-color: v.$gray;
  border: 2px solid v.$red;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.errorContainer h1 {
  color: v.$red;
  margin-bottom: 1rem;
}

.errorMessage {
  color: v.$white;
  margin-bottom: 1.5rem;
  font-family: monospace;
  font-size: 0.9rem;
  background-color: v.$black;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.errorDetails {
  margin: 1.5rem 0;
  text-align: left;
  cursor: pointer;

  summary {
    color: v.$orange;
    padding: 0.5rem;
    user-select: none;

    &:hover {
      background-color: rgba(254, 188, 44, 0.1);
    }
  }

  pre {
    background-color: v.$black;
    color: v.$white;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btnRetry,
.btnHome {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.btnRetry {
  background-color: v.$yellow;
  color: v.$black;
  font-weight: bold;

  &:hover {
    background-color: darken(v.$yellow, 10%);
  }
}

.btnHome {
  background-color: v.$teal;
  color: v.$black;

  &:hover {
    background-color: darken(v.$teal, 10%);
  }
}
```

**File:** `/app/components/ErrorBoundary/index.js` (NEW)

```javascript
export { default } from "./ErrorBoundary";
```

**Usage in `/app/root.jsx`:**

```javascript
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Root() {
  return (
    <ErrorBoundary>
      <Header />
      <main>
        <Outlet />
      </main>
    </ErrorBoundary>
  );
}
```

---

### 2. Logger Utility

**File:** `/app/utils/logger.js` (NEW)

```javascript
/**
 * Structured logging utility for the application
 * Provides consistent error and info logging with context
 */

const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production";
const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development";

/**
 * Internal log entry formatter
 */
function formatLogEntry(level, message, data = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
    environment: isProduction ? "production" : "development",
  };
}

/**
 * Log an error with full context
 *
 * @param {string} message - Human-readable error message
 * @param {Error} error - Error object
 * @param {object} context - Additional context (userId, requestId, etc.)
 */
export function logError(message, error, context = {}) {
  const logEntry = formatLogEntry("ERROR", message, {
    error: error?.message || error,
    stack: isDevelopment ? error?.stack : undefined,
    ...context,
  });

  // Always log to console
  console.error(JSON.stringify(logEntry, null, isDevelopment ? 2 : 0));

  // In production, send to error tracking service
  // Uncomment when ready to integrate with Sentry, DataDog, etc.
  // if (isProduction) {
  //   sendToErrorTracking(logEntry);
  // }
}

/**
 * Log an info message with context
 *
 * @param {string} message - Human-readable message
 * @param {object} data - Additional data to log
 */
export function logInfo(message, data = {}) {
  const logEntry = formatLogEntry("INFO", message, data);
  console.log(JSON.stringify(logEntry, null, isDevelopment ? 2 : 0));
}

/**
 * Log a warning
 *
 * @param {string} message - Human-readable warning
 * @param {object} data - Additional data
 */
export function logWarn(message, data = {}) {
  const logEntry = formatLogEntry("WARN", message, data);
  console.warn(JSON.stringify(logEntry, null, isDevelopment ? 2 : 0));
}

/**
 * Log a debug message (only in development)
 *
 * @param {string} message - Debug message
 * @param {object} data - Debug data
 */
export function logDebug(message, data = {}) {
  if (!isDevelopment) return;

  const logEntry = formatLogEntry("DEBUG", message, data);
  console.log(JSON.stringify(logEntry, null, 2));
}
```

**File:** `/app/utils/requestId.js` (NEW)

```javascript
/**
 * Request ID tracking for correlating logs across API calls
 * Generates unique ID for each request to trace it through the system
 */

import { randomUUID } from "crypto";

// Store request ID in a global-like structure (works in SSR)
const requestIdStorage = new Map();

/**
 * Generate or get existing request ID for current context
 */
export function getOrCreateRequestId() {
  let id = requestIdStorage.get("current");
  if (!id) {
    id = randomUUID();
    requestIdStorage.set("current", id);
  }
  return id;
}

/**
 * Set request ID for current context
 */
export function setRequestId(id) {
  requestIdStorage.set("current", id);
}

/**
 * Clear request ID (call after request completes)
 */
export function clearRequestId() {
  requestIdStorage.delete("current");
}

/**
 * Get current request ID
 */
export function getRequestId() {
  return requestIdStorage.get("current");
}
```

---

### 3. CSRF Protection

**File:** `/app/utils/csrf.js` (NEW)

```javascript
/**
 * CSRF Token generation and validation
 * Prevents cross-site request forgery attacks
 */

import crypto from "crypto";

const TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 * Should be called when user logs in or session starts
 */
export function generateCSRFToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Validate a CSRF token using timing-safe comparison
 * Prevents timing-based attacks
 */
export function validateCSRFToken(providedToken, sessionToken) {
  if (!providedToken || !sessionToken) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(sessionToken)
    );
  } catch {
    return false;
  }
}

/**
 * Get CSRF token from request headers
 * Looks in: x-csrf-token header, or _csrf field in body
 */
export function getCSRFTokenFromRequest(request, body = null) {
  // Check header first
  const headerToken = request.headers.get("x-csrf-token");
  if (headerToken) {
    return headerToken;
  }

  // Check form data
  if (body && body._csrf) {
    return body._csrf;
  }

  return null;
}
```

**Usage in API routes:**

```javascript
// In /api/brands.js or any modification endpoint
import { validateCSRFToken, getCSRFTokenFromRequest } from "@/utils/csrf";
import { getRequestId, logError } from "@/utils/logger";

export async function action({ request }) {
  const requestId = getOrCreateRequestId();
  const method = request.method;

  try {
    // Validate CSRF for any state-changing request
    if (method === "POST" || method === "PUT" || method === "DELETE") {
      const body = await request.json();
      const providedToken = getCSRFTokenFromRequest(request, body);
      const sessionToken = request.headers.get("x-session-csrf");

      if (!validateCSRFToken(providedToken, sessionToken)) {
        logWarn("CSRF token validation failed", {
          requestId,
          method,
          endpoint: "/api/brands",
        });
        return Response.json(
          { success: false, error: "Invalid CSRF token" },
          { status: 403 }
        );
      }

      // ... rest of endpoint
    }
  } catch (error) {
    logError("Error in brands API", error, { requestId, method });
    // ... error handling
  }
}
```

---

## Phase 2: API Utilities

### 4. Shared Error Handling

**File:** `/app/utils/apiError.js` (NEW)

```javascript
/**
 * API Error handling utilities
 * Provides consistent error responses across all endpoints
 */

import { logError } from "./logger";

/**
 * Standard API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Create a success response
 */
export function successResponse(data, statusCode = 200) {
  return Response.json({ success: true, data }, { status: statusCode });
}

/**
 * Create an error response
 */
export function errorResponse(message, statusCode = 400, details = null) {
  return Response.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

/**
 * Create a "method not allowed" response
 */
export function methodNotAllowedResponse() {
  return errorResponse("Method not allowed", 405);
}

/**
 * Create a "not found" response
 */
export function notFoundResponse(resource = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create an "unauthorized" response
 */
export function unauthorizedResponse() {
  return errorResponse("Unauthorized", 401);
}

/**
 * Create a "forbidden" response
 */
export function forbiddenResponse(message = "Access denied") {
  return errorResponse(message, 403);
}

/**
 * Create a "conflict" response (duplicate resource)
 */
export function conflictResponse(message) {
  return errorResponse(message, 409);
}

/**
 * Handle API errors with logging
 * Usage: catch (error) { handleAPIError(error, "brands", request) }
 */
export function handleAPIError(error, resourceName, request = null) {
  const isAPIError = error instanceof APIError;
  const statusCode = isAPIError ? error.statusCode : 500;
  const message = error.message || "Internal server error";

  const context = {
    resource: resourceName,
  };

  if (request) {
    context.method = request.method;
    context.url = request.url;
  }

  logError(`Error in ${resourceName} API`, error, context);

  return errorResponse(message, statusCode, isAPIError ? error.details : null);
}
```

---

### 5. Shared Validation

**File:** `/app/utils/validation.js` (NEW)

```javascript
/**
 * Shared validation utilities for API routes
 * Ensures consistent validation across the application
 */

import { errorResponse, conflictResponse } from "./apiError";

/**
 * Check if a unique field already exists (for create/update operations)
 *
 * @param {Object} prismaModel - Prisma model (prisma.brand, prisma.user, etc.)
 * @param {string} fieldName - Field to check (e.g., "code", "email")
 * @param {string} fieldValue - Value to check
 * @param {string} excludeId - ID to exclude (for updates)
 * @returns {Object|null} Existing record or null
 */
export async function checkDuplicateField(
  prismaModel,
  fieldName,
  fieldValue,
  excludeId = null
) {
  const where = { [fieldName]: fieldValue };

  if (excludeId) {
    where.NOT = { id: excludeId };
    return await prismaModel.findFirst({ where });
  }

  return await prismaModel.findUnique({ where });
}

/**
 * Create a duplicate field error response
 */
export function duplicateFieldError(fieldName, fieldValue = null) {
  const message = fieldValue
    ? `${fieldName} "${fieldValue}" already exists`
    : `${fieldName} already exists`;
  return conflictResponse(message);
}

/**
 * Validate required string field
 */
export function validateRequiredString(field, value) {
  if (!value || !value.trim()) {
    return `${field} is required`;
  }
  return null;
}

/**
 * Validate string length
 */
export function validateStringLength(field, value, { min = 0, max = null } = {}) {
  const length = value?.length || 0;

  if (length < min) {
    return `${field} must be at least ${min} characters`;
  }

  if (max && length > max) {
    return `${field} must not exceed ${max} characters`;
  }

  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return null;
}

/**
 * Validate brand code (must be exactly 4 uppercase letters)
 */
export function validateBrandCode(code) {
  if (!/^[A-Z]{4}$/.test(code)) {
    return "Brand code must be exactly 4 uppercase letters (e.g., LVCI)";
  }
  return null;
}

/**
 * Validate ISCI code format (e.g., LVCI2501)
 */
export function validateISCICodeFormat(code) {
  if (!/^[A-Z]{4}\d{4,5}$/.test(code)) {
    return "Invalid ISCI code format (e.g., LVCI2501)";
  }
  return null;
}

/**
 * Sanitize string input (trim whitespace)
 */
export function sanitizeString(value) {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim();
}

/**
 * Convert string to appropriate value type
 */
export function parseValue(value, type) {
  switch (type) {
    case "number":
      return value ? parseInt(value, 10) : null;
    case "boolean":
      return value === "true" || value === true || value === 1;
    case "date":
      return value ? new Date(value) : null;
    case "string":
    default:
      return sanitizeString(value);
  }
}

/**
 * Field constraints configuration
 * Used for consistent validation across application
 */
export const FIELD_CONSTRAINTS = {
  brand: {
    name: { min: 1, max: 100 },
    code: { min: 4, max: 4 },
  },
  isciCode: {
    code: { min: 8, max: 9 },
    spotTitle: { min: 1, max: 200 },
    campaignName: { min: 0, max: 100 },
    description: { min: 0, max: 500 },
    assignedEditor: { min: 0, max: 100 },
  },
  user: {
    firstName: { min: 1, max: 50 },
    lastName: { min: 1, max: 50 },
    email: { min: 5, max: 100 },
    password: { min: 6, max: 100 },
  },
  agency: {
    name: { min: 1, max: 100 },
  },
};
```

---

### 6. Shared Date Utilities

**File:** `/app/utils/dateUtils.js` (NEW)

```javascript
/**
 * Shared date handling utilities
 * Ensures consistent date parsing and formatting across application
 */

/**
 * Parse a date string, with option for default value
 *
 * @param {string|Date|null} value - Value to parse
 * @param {boolean} defaultToNow - If true and value is empty, return current date
 * @returns {Date|null}
 */
export function parseDate(value, defaultToNow = false) {
  if (!value) {
    return defaultToNow ? new Date() : null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  return isValidDate(date) ? date : null;
}

/**
 * Parse a required date (must have value)
 */
export function parseDateRequired(value) {
  return parseDate(value, false);
}

/**
 * Parse a date with default to current time
 */
export function parseDateWithDefault(value) {
  return parseDate(value, true);
}

/**
 * Check if a date is valid
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Format date for display
 */
export function formatDate(date, locale = "en-US") {
  if (!date) {
    return "N/A";
  }

  const d = new Date(date);
  if (!isValidDate(d)) {
    return "N/A";
  }

  return d.toLocaleDateString(locale);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date, locale = "en-US") {
  if (!date) {
    return "N/A";
  }

  const d = new Date(date);
  if (!isValidDate(d)) {
    return "N/A";
  }

  return d.toLocaleString(locale);
}

/**
 * Get ISO string from date
 */
export function toISOString(date) {
  if (!date) {
    return null;
  }

  const d = new Date(date);
  return isValidDate(d) ? d.toISOString() : null;
}

/**
 * Compare two dates
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Check if date is in past
 */
export function isPastDate(date) {
  return new Date(date) < new Date();
}

/**
 * Check if date is in future
 */
export function isFutureDate(date) {
  return new Date(date) > new Date();
}

/**
 * Get days difference between two dates
 */
export function getDaysDifference(date1, date2) {
  const ms = new Date(date2) - new Date(date1);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
```

---

## Phase 2: Component Utilities

### 7. File Validation Utility

**File:** `/app/utils/fileValidation.js` (NEW)

```javascript
/**
 * File validation utilities
 * Shared constraints and validation for file uploads
 */

/**
 * Image validation constraints
 */
export const IMAGE_VALIDATION = {
  validTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  maxSize: 5 * 1024 * 1024, // 5MB
  maxSizeLabel: "5MB",
};

/**
 * Validate an image file
 * Returns array of error messages (empty if valid)
 */
export function validateImageFile(file) {
  const errors = [];

  if (!file) {
    errors.push("Please select a file");
    return errors;
  }

  // Check file type
  if (!IMAGE_VALIDATION.validTypes.includes(file.type)) {
    errors.push(
      "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image."
    );
  }

  // Check file size
  if (file.size > IMAGE_VALIDATION.maxSize) {
    errors.push(
      `File too large. Maximum size is ${IMAGE_VALIDATION.maxSizeLabel}.`
    );
  }

  return errors;
}

/**
 * Get a single error message from validation
 * (Useful for form field error display)
 */
export function getFirstImageError(file) {
  const errors = validateImageFile(file);
  return errors.length > 0 ? errors[0] : null;
}

/**
 * Check if file is valid without detailed error messages
 */
export function isValidImageFile(file) {
  return validateImageFile(file).length === 0;
}
```

---

### 8. Confirmation Utility

**File:** `/app/utils/confirmation.js` (NEW)

```javascript
/**
 * Confirmation messages and utilities
 * Standardized confirmation dialogs across the application
 */

/**
 * Standard confirmation messages
 */
export const CONFIRMATION_MESSAGES = {
  deleteISCICode: "Are you sure you want to delete this ISCI code? This action cannot be undone.",
  deleteItem: "Are you sure you want to delete this item? This action cannot be undone.",
  deleteBrand: "Are you sure you want to delete this brand? Make sure there are no ISCI codes using it.",
  deleteUser: "Are you sure you want to delete this user? This action cannot be undone.",
  deleteAgency: "Are you sure you want to delete this agency? This action cannot be undone.",
  unsavedChanges: "You have unsaved changes. Do you want to discard them?",
};

/**
 * Request user confirmation using browser dialog
 * In the future, this could be replaced with a custom modal component
 *
 * @param {string} message - Confirmation message
 * @returns {boolean} - True if user confirmed, false otherwise
 */
export function requestConfirmation(message) {
  return window.confirm(message);
}

/**
 * Request deletion confirmation
 */
export function requestDeleteConfirmation(resourceType = "item") {
  const message = CONFIRMATION_MESSAGES[`delete${resourceType}`]
    || CONFIRMATION_MESSAGES.deleteItem;
  return requestConfirmation(message);
}

/**
 * Request confirmation for unsaved changes
 */
export function requestUnsavedChangesConfirmation() {
  return requestConfirmation(CONFIRMATION_MESSAGES.unsavedChanges);
}
```

---

## Summary

These utilities provide the foundation for Phase 1 & 2 refactoring:

### Created Files (11 new files):
1. `/app/components/ErrorBoundary/ErrorBoundary.jsx`
2. `/app/components/ErrorBoundary/ErrorBoundary.module.scss`
3. `/app/components/ErrorBoundary/index.js`
4. `/app/utils/logger.js`
5. `/app/utils/requestId.js`
6. `/app/utils/csrf.js`
7. `/app/utils/apiError.js`
8. `/app/utils/validation.js`
9. `/app/utils/dateUtils.js`
10. `/app/utils/fileValidation.js`
11. `/app/utils/confirmation.js`

### Modified Files (All API routes):
- `/api/brands.js` - Replace error handling with `handleAPIError()`
- `/api/agencies.js` - Replace error handling with `handleAPIError()`
- `/api/users.js` - Replace error handling with `handleAPIError()`
- `/api/isci.js` - Replace error handling with `handleAPIError()`

### Modified Files (Root):
- `/app/root.jsx` - Wrap with ErrorBoundary

---

**Total Refactoring Effort for Phase 1-2:** ~12-15 hours
- Implementation: 8-10 hours
- Testing: 2-3 hours
- Integration: 2 hours

