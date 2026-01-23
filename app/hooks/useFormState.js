import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useFormState - Custom hook for managing form state
 *
 * This hook provides a simplified interface for managing form data, including:
 * - Centralized form state management
 * - Individual field updates
 * - Bulk field updates
 * - Form reset functionality
 * - Error state management
 *
 * @param {object} initialState - Initial form values
 * @param {object} options - Configuration options
 * @param {function} options.validate - Optional validation function
 * @param {function} options.onSubmit - Optional submit handler
 *
 * @returns {object} Form state and handlers
 *
 * @example
 * const {
 *   formData,
 *   errors,
 *   handleChange,
 *   handleSubmit,
 *   setFormData,
 *   resetForm
 * } = useFormState({
 *   name: "",
 *   email: "",
 *   password: ""
 * }, {
 *   validate: (data) => {
 *     const errors = {};
 *     if (!data.email) errors.email = "Email is required";
 *     return errors;
 *   },
 *   onSubmit: async (data) => {
 *     await saveData(data);
 *   }
 * });
 */
const useFormState = (initialState, options = {}) => {
  const { validate, onSubmit } = options;

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialStateRef = useRef(initialState);
  const validateRef = useRef(validate);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);

  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  /**
   * Handle input change for a single field
   * Supports both direct values and event objects
   */
  const handleChange = useCallback((nameOrEvent, value) => {
    // Check if first argument is an event object
    if (nameOrEvent && nameOrEvent.target) {
      const { name, value: eventValue, type, checked } = nameOrEvent.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : eventValue
      }));
    } else {
      // Direct name/value pair
      setFormData(prev => ({
        ...prev,
        [nameOrEvent]: value
      }));
    }

    // Clear error for this field when it changes
    if (errors[nameOrEvent]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[nameOrEvent];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((newInitialState = initialState) => {
    setFormData(newInitialState || initialStateRef.current);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const validator = validateRef.current;
    if (!validator || typeof validator !== "function") {
      return true;
    }

    const validationErrors = validator(formData);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (event) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    // Validate if validation function provided
    if (!validateForm()) {
      return false;
    }

    // Call onSubmit if provided
    const submitHandler = onSubmitRef.current;
    if (submitHandler && typeof submitHandler === "function") {
      setIsSubmitting(true);
      try {
        await submitHandler(formData);
        return true;
      } catch (error) {
        console.error("Form submission error:", error);
        setErrors(prev => ({
          ...prev,
          submit: error.message || "An error occurred during submission"
        }));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }

    return true;
  }, [formData, validateForm]);

  /**
   * Set a specific error
   */
  const setError = useCallback((field, message) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  /**
   * Clear a specific error
   */
  const clearError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
    updateFields,
    resetForm,
    validateForm,
    setError,
    clearError,
    clearErrors
  };
};

export default useFormState;
