import { useState, useEffect } from "react";
import { ISCIStatus } from "../../types/isci";
import "./ISCIForm.scss";

/**
 * ISCIForm Component
 *
 * The "let me create or edit an ISCI code" form.
 * This bad boy handles both creating NEW codes and editing EXISTING ones.
 * It's like a Swiss Army knife, but for forms! 🔪
 *
 * Props we're expecting:
 *   - code: An existing ISCI code object (if we're editing) or null (if we're creating)
 *   - onSubmit: Function to call when form is submitted (passes form data back up)
 *   - onCancel: Function to call when user chickens out and hits cancel
 */
const ISCIForm = ({ code, onSubmit, onCancel }) => {
  /**
   * formData state
   *
   * This is where we store everything the user types into the form.
   * Think of it as a clipboard that remembers what they wrote.
   * We start with empty/default values and update as they type.
   */
  const [formData, setFormData] = useState({
    code: "",                              // The 8-character ISCI code
    advertiser: "",                        // Company name (who's paying the bills)
    title: "",                             // Campaign title
    description: "",                       // Optional notes
    duration: undefined,                   // Video length in seconds
    format: "",                            // Video format (1080p, 4K, etc.)
    assignedEditor: "",                    // Who's doing the work
    status: ISCIStatus.PENDING,           // Default to "pending" (aka "I'll get to it eventually")
    dueDate: "",                           // When is this due? (important for panic levels)
  });

  /**
   * errors state
   *
   * Stores validation errors for each field.
   * If a field has an error, we show a red message under it.
   * Empty object = everything's cool! 😎
   */
  const [errors, setErrors] = useState({});

  /**
   * useEffect Hook
   *
   * This runs when the 'code' prop changes.
   * If we're editing an existing code, this fills in the form with its data.
   * It's like Auto-Fill but for our form! (Thanks, useEffect!)
   *
   * Dependencies: [code] means "run this whenever 'code' changes"
   */
  useEffect(() => {
    if (code) {
      // If there's a code to edit, populate the form with its data
      setFormData({
        code: code.code,
        advertiser: code.advertiser,
        title: code.title,
        description: code.description || "",           // Use empty string if description is missing
        duration: code.duration,
        format: code.format || "",                     // Use empty string if format is missing
        assignedEditor: code.assignedEditor || "",     // Use empty string if no editor assigned
        status: code.status,
        // Split the date string to get just the date part (remove time)
        // "2024-01-15T10:00:00.000Z" becomes "2024-01-15"
        dueDate: code.dueDate ? code.dueDate.split('T')[0] : "",
      });
    }
  }, [code]);

  /**
   * validateForm
   *
   * The bouncer at the club - checks if everything's valid before letting it through.
   * Returns true if all good, false if something's wrong.
   *
   * Validation rules:
   *   - ISCI code: Required, must be exactly 8 UPPERCASE alphanumeric characters
   *   - Advertiser: Required, can't be empty
   *   - Title: Required, can't be empty
   */
  const validateForm = () => {
    const newErrors = {};

    // Check the ISCI code
    if (!formData.code.trim()) {
      // trim() removes whitespace - we don't count "   " as a valid code!
      newErrors.code = "ISCI code is required";
    } else if (!/^[A-Z0-9]{8}$/.test(formData.code)) {
      // Regex check: Must be exactly 8 characters, only A-Z and 0-9
      // Examples: NIKE0001 ✅  nike0001 ❌  NIKE01 ❌  NIKE00011 ❌
      newErrors.code = "ISCI code must be 8 alphanumeric characters (e.g., ABCD1234)";
    }

    // Check the advertiser field
    if (!formData.advertiser.trim()) {
      newErrors.advertiser = "Advertiser is required";
    }

    // Check the title field
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    // Store any errors we found
    setErrors(newErrors);

    // Return true if no errors (empty object), false if we found problems
    // Object.keys(newErrors).length === 0 means "no error messages"
    return Object.keys(newErrors).length === 0;
  };

  /**
   * handleChange
   *
   * This fires every time someone types in a field or changes a dropdown.
   * It updates our formData state so React knows what the user entered.
   *
   * Fun fact: We have special handling for the "duration" field to convert it to a number!
   */
  const handleChange = (e) => {
    const { name, value } = e.target;  // Get the field name and what they typed

    setFormData(prev => ({
      ...prev,  // Keep all the other fields the same (the "..." is called spread syntax)
      // Special case: If it's duration, parse it as a number. Otherwise, just use the value.
      [name]: name === "duration" ? (value ? parseInt(value) : undefined) : value,
    }));

    // If this field had an error before, clear it when they start typing
    // Nobody likes staring at error messages while they're fixing things!
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  /**
   * handleSubmit
   *
   * The big moment! User clicked "Create" or "Update" button.
   * First we validate everything, then if it's all good, we send it up to the parent component.
   */
  const handleSubmit = (e) => {
    e.preventDefault();  // Stop the form from doing a page refresh (old-school HTML behavior)

    // Check if everything's valid
    if (validateForm()) {
      // All good! Send the data back to the parent component
      onSubmit(formData);
    }
    // If validation fails, the error messages will show up automatically
  };

  return (
    <div className="isci-form-container">
      {/* Dynamic title: "Edit" if we have a code, "Create New" if we don't */}
      <h2>{code ? "Edit ISCI Code" : "Create New ISCI Code"}</h2>

      <form onSubmit={handleSubmit} className="isci-form">
        {/* Row 1: ISCI Code and Advertiser side by side */}
        <div className="form-row">
          {/* ISCI Code Field - THE most important field! */}
          <div className="form-group">
            <label htmlFor="code">ISCI Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="ABCD1234"
              maxLength={8}  // Can't type more than 8 characters
              className={errors.code ? "error" : ""}  // Add "error" class if there's an error
            />
            {/* Show error message if there is one */}
            {errors.code && <span className="error-message">{errors.code}</span>}
          </div>

          {/* Advertiser Field - Who's paying for this? */}
          <div className="form-group">
            <label htmlFor="advertiser">Advertiser *</label>
            <input
              type="text"
              id="advertiser"
              name="advertiser"
              value={formData.advertiser}
              onChange={handleChange}
              placeholder="Company Name"
              className={errors.advertiser ? "error" : ""}
            />
            {errors.advertiser && <span className="error-message">{errors.advertiser}</span>}
          </div>
        </div>

        {/* Title Field - Full width, this one gets its own row */}
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Campaign Title"
            className={errors.title ? "error" : ""}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* Description Field - Optional, multiline textarea for longer notes */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Additional details about this project..."
            rows={3}  // 3 rows tall by default
          />
        </div>

        {/* Row 2: Duration and Format side by side */}
        <div className="form-row">
          {/* Duration Field - How long is the video? */}
          <div className="form-group">
            <label htmlFor="duration">Duration (seconds)</label>
            <input
              type="number"  // Only allows numbers
              id="duration"
              name="duration"
              value={formData.duration || ""}  // Show empty if undefined
              onChange={handleChange}
              placeholder="30"
              min="1"  // Can't be negative or zero (no videos that don't exist!)
            />
          </div>

          {/* Format Field - Video quality/format */}
          <div className="form-group">
            <label htmlFor="format">Format</label>
            <input
              type="text"
              id="format"
              name="format"
              value={formData.format}
              onChange={handleChange}
              placeholder="1080p, 4K, etc."
            />
          </div>
        </div>

        {/* Row 3: Assigned Editor and Status side by side */}
        <div className="form-row">
          {/* Assigned Editor Field - Who's working on this? */}
          <div className="form-group">
            <label htmlFor="assignedEditor">Assigned Editor</label>
            <input
              type="text"
              id="assignedEditor"
              name="assignedEditor"
              value={formData.assignedEditor}
              onChange={handleChange}
              placeholder="Editor Name"
            />
          </div>

          {/* Status Field - Dropdown with all the status options */}
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {/* Each status gets an option in the dropdown */}
              <option value={ISCIStatus.PENDING}>Pending</option>
              <option value={ISCIStatus.IN_PROGRESS}>In Progress</option>
              <option value={ISCIStatus.IN_REVIEW}>In Review</option>
              <option value={ISCIStatus.COMPLETED}>Completed</option>
              <option value={ISCIStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>

        {/* Due Date Field - When does this need to be done? */}
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"  // Shows a nice calendar picker!
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>

        {/* Action Buttons - Cancel or Submit */}
        <div className="form-actions">
          {/* Cancel Button - "Nevermind, I changed my mind!" */}
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>

          {/* Submit Button - Text changes based on create vs edit mode */}
          <button type="submit" className="btn-submit">
            {code ? "Update" : "Create"} ISCI Code
          </button>
        </div>
      </form>
    </div>
  );
};

export default ISCIForm;
