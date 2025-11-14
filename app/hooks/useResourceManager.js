import { useState, useEffect, useCallback } from "react";

/**
 * useResourceManager - Custom hook for managing CRUD operations on resources
 *
 * This hook consolidates the common pattern used by BrandManager, UserManager, and AgencyManager.
 * It provides a complete interface for:
 * - Loading resources from API
 * - Creating new resources
 * - Updating existing resources
 * - Deleting resources
 * - Toggling active status
 * - Form state management with validation
 * - Smooth animations for form show/hide
 *
 * @param {string} endpoint - API endpoint (e.g., "/api/brands")
 * @param {object} options - Configuration options
 * @param {object} options.initialFormData - Initial form field values
 * @param {function} options.validate - Validation function (receives formData and resources)
 * @param {function} options.createItem - Custom item creation function (default uses generated ID)
 * @param {function} options.updateItem - Custom item update function (default spreads formData)
 * @param {function} options.hasActiveToggle - Whether resource supports active/inactive toggle
 * @param {function} options.onAfterSave - Callback after successful save
 * @param {function} options.onAfterDelete - Callback after successful delete
 *
 * @returns {object} Resource manager state and methods
 *
 * @example
 * const {
 *   items: brands,
 *   formData,
 *   errors,
 *   isLoading,
 *   showForm,
 *   editingItem,
 *   handleChange,
 *   handleSubmit,
 *   handleEdit,
 *   handleDelete,
 *   handleToggleActive,
 *   handleNew,
 *   resetForm
 * } = useResourceManager("/api/brands", {
 *   initialFormData: { name: "", code: "" },
 *   validate: (data, brands) => {
 *     const errors = {};
 *     if (!data.name) errors.name = "Name is required";
 *     if (!data.code.match(/^[A-Z]{4}$/)) errors.code = "Invalid code";
 *     return errors;
 *   },
 *   hasActiveToggle: true
 * });
 */
const useResourceManager = (endpoint, options = {}) => {
  const {
    initialFormData = {},
    validate,
    createItem,
    updateItem,
    hasActiveToggle = false,
    onAfterSave,
    onAfterDelete
  } = options;

  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  /**
   * Load resources from API
   */
  const loadItems = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error(`Error loading data from ${endpoint}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    if (!validate || typeof validate !== "function") {
      return true;
    }

    const validationErrors = validate(formData, items, editingItem);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData, items, editingItem, validate]);

  /**
   * Save items to API
   */
  const saveItems = useCallback(async (updatedItems) => {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItems),
      });
      setItems(updatedItems);
      return true;
    } catch (error) {
      console.error(`Error saving data to ${endpoint}:`, error);
      return false;
    }
  }, [endpoint]);

  /**
   * Handle form input changes
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    const now = new Date().toISOString();
    let updatedItems;

    if (editingItem) {
      // Update existing item
      if (updateItem && typeof updateItem === "function") {
        // Use custom item update function
        updatedItems = items.map(item =>
          item.id === editingItem.id
            ? updateItem(item, formData, now)
            : item
        );
      } else {
        // Default update (spread formData over existing item)
        updatedItems = items.map(item =>
          item.id === editingItem.id
            ? { ...item, ...formData, updatedAt: now }
            : item
        );
      }
    } else {
      // Create new item
      let newItem;

      if (createItem && typeof createItem === "function") {
        // Use custom item creation function
        newItem = createItem(formData, now);
      } else {
        // Default item creation
        newItem = {
          id: Date.now().toString(),
          ...formData,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
      }

      updatedItems = [...items, newItem];
    }

    const success = await saveItems(updatedItems);

    if (success) {
      resetForm();
      if (onAfterSave && typeof onAfterSave === "function") {
        onAfterSave(updatedItems);
      }
    }

    return success;
  }, [formData, editingItem, items, validateForm, saveItems, createItem, onAfterSave]);

  /**
   * Start editing an item
   */
  const handleEdit = useCallback((item) => {
    setEditingItem(item);

    // Copy only the fields that exist in initialFormData
    const formFields = Object.keys(initialFormData).reduce((acc, key) => {
      acc[key] = item[key] !== undefined ? item[key] : initialFormData[key];
      return acc;
    }, {});

    setFormData(formFields);
    setShowForm(true);
  }, [initialFormData]);

  /**
   * Delete an item
   */
  const handleDelete = useCallback(async (id, confirmMessage = "Are you sure you want to delete this item?") => {
    if (!confirm(confirmMessage)) {
      return false;
    }

    const updatedItems = items.filter(item => item.id !== id);
    const success = await saveItems(updatedItems);

    if (success && onAfterDelete && typeof onAfterDelete === "function") {
      onAfterDelete(updatedItems);
    }

    return success;
  }, [items, saveItems, onAfterDelete]);

  /**
   * Toggle active status
   */
  const handleToggleActive = useCallback(async (item) => {
    if (!hasActiveToggle) {
      console.warn("Active toggle is not enabled for this resource manager");
      return false;
    }

    const updatedItems = items.map(i =>
      i.id === item.id
        ? { ...i, active: !i.active, updatedAt: new Date().toISOString() }
        : i
    );

    return await saveItems(updatedItems);
  }, [items, hasActiveToggle, saveItems]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setFormData(initialFormData);
      setEditingItem(null);
      setErrors({});
      setShowForm(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  }, [initialFormData]);

  /**
   * Show form for creating new item
   */
  const handleNew = useCallback(() => {
    setEditingItem(null);
    setFormData(initialFormData);
    setErrors({});
    setShowForm(true);
  }, [initialFormData]);

  /**
   * Update form data directly (for complex updates)
   */
  const setFormField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Bulk update form data
   */
  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // Data
    items,
    formData,
    errors,
    isLoading,
    showForm,
    isClosing,
    editingItem,

    // Methods
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleNew,
    resetForm,
    setFormField,
    updateFormData,
    loadItems,

    // Direct setters (use with caution)
    setItems,
    setFormData,
    setErrors,
    setShowForm
  };
};

export default useResourceManager;
