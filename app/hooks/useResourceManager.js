import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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
    createItem: createItemFn,
    updateItem: updateItemFn,
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

  const validateRef = useRef(validate);
  const createItemRef = useRef(createItemFn);
  const updateItemRef = useRef(updateItemFn);
  const onAfterSaveRef = useRef(onAfterSave);
  const onAfterDeleteRef = useRef(onAfterDelete);

  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  useEffect(() => {
    createItemRef.current = createItemFn;
  }, [createItemFn]);

  useEffect(() => {
    updateItemRef.current = updateItemFn;
  }, [updateItemFn]);

  useEffect(() => {
    onAfterSaveRef.current = onAfterSave;
  }, [onAfterSave]);

  useEffect(() => {
    onAfterDeleteRef.current = onAfterDelete;
  }, [onAfterDelete]);

  // Memoize initialFormData keys for handleEdit optimization
  const initialFormDataKeys = useMemo(
    () => Object.keys(initialFormData),
    [initialFormData]
  );

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
    const validator = validateRef.current;
    if (!validator || typeof validator !== "function") {
      return true;
    }

    const validationErrors = validator(formData, items, editingItem);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData, items, editingItem]);

  /**
   * Create a new item via API (POST)
   */
  const createItemApi = useCallback(async (item) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create item");
      }
      return result;
    } catch (error) {
      console.error(`Error creating item at ${endpoint}:`, error);
      throw error;
    }
  }, [endpoint]);

  /**
   * Update an existing item via API (PUT)
   */
  const updateItemApi = useCallback(async (item) => {
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update item");
      }
      return result;
    } catch (error) {
      console.error(`Error updating item at ${endpoint}:`, error);
      throw error;
    }
  }, [endpoint]);

  /**
   * Delete an item via API (DELETE)
   */
  const deleteItemApi = useCallback(async (id) => {
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete item");
      }
      return result;
    } catch (error) {
      console.error(`Error deleting item at ${endpoint}:`, error);
      throw error;
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
   * Reset form to initial state
   * (Defined before handleSubmit to avoid initialization error)
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

    try {
      if (editingItem) {
        // Update existing item via PUT
        let itemData;
        const updateFn = updateItemRef.current;
        if (updateFn && typeof updateFn === "function") {
          // Use custom item update function
          itemData = updateFn(editingItem, formData, now);
        } else {
          // Default update (spread formData over existing item)
          itemData = { ...editingItem, ...formData, updatedAt: now };
        }

        await updateItemApi(itemData);

        // Update local state
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === editingItem.id ? itemData : item
          )
        );
      } else {
        // Create new item via POST
        let newItem;
        const createFn = createItemRef.current;
        if (createFn && typeof createFn === "function") {
          // Use custom item creation function
          newItem = createFn(formData, now);
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

        await createItemApi(newItem);

        // Update local state
        setItems(prevItems => [newItem, ...prevItems]);
      }

      resetForm();
      const afterSave = onAfterSaveRef.current;
      if (afterSave && typeof afterSave === "function") {
        afterSave(items);
      }

      return true;
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: error.message });
      return false;
    }
  }, [formData, editingItem, items, validateForm, createItemApi, updateItemApi, resetForm]);

  /**
   * Start editing an item
   */
  const handleEdit = useCallback((item) => {
    setEditingItem(item);

    // Copy only the fields that exist in initialFormData (using memoized keys)
    const formFields = initialFormDataKeys.reduce((acc, key) => {
      acc[key] = item[key] !== undefined ? item[key] : initialFormData[key];
      return acc;
    }, {});

    setFormData(formFields);
    setShowForm(true);
  }, [initialFormData, initialFormDataKeys]);

  /**
   * Delete an item
   */
  const handleDelete = useCallback(async (id, confirmMessage = "Are you sure you want to delete this item?") => {
    if (!confirm(confirmMessage)) {
      return false;
    }

    try {
      await deleteItemApi(id);

      // Update local state
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);

      const afterDelete = onAfterDeleteRef.current;
      if (afterDelete && typeof afterDelete === "function") {
        afterDelete(updatedItems);
      }

      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  }, [items, deleteItemApi, onAfterDelete]);

  /**
   * Toggle active status
   */
  const handleToggleActive = useCallback(async (item) => {
    if (!hasActiveToggle) {
      console.warn("Active toggle is not enabled for this resource manager");
      return false;
    }

    try {
      const updatedItem = {
        ...item,
        active: !item.active,
        updatedAt: new Date().toISOString(),
      };

      await updateItemApi(updatedItem);

      // Update local state
      setItems(prevItems =>
        prevItems.map(i => (i.id === item.id ? updatedItem : i))
      );

      return true;
    } catch (error) {
      console.error("Error toggling active status:", error);
      return false;
    }
  }, [hasActiveToggle, updateItemApi]);

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
