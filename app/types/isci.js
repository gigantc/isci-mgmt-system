/**
 * ISCI Status Constants
 *
 * These are all the different stages an ISCI code can be in.
 * Think of it like tracking a pizza delivery: ordered → cooking → out for delivery → delivered → (eaten)
 *
 * ISCI = Industry Standard Coding Identification
 * Basically fancy barcodes for TV commercials! 🎬
 */
export const ISCIStatus = {
  PENDING: "pending",           // "I'll get to it eventually..." - Not started yet
  IN_PROGRESS: "in_progress",   // Currently being worked on (editor is caffeinated and ready!)
  IN_REVIEW: "in_review",       // "Let me ask my manager..." - Waiting for approval
  COMPLETED: "completed",        // Done! Ship it! 🚀
  ARCHIVED: "archived"          // Old but not forgotten (like your MySpace profile)
};
