import { useResourceManager } from "@/hooks";
import styles from "./AgencyManager.module.scss";

const AgencyManager = () => {
  const {
    items: agencies,
    formData,
    errors,
    isLoading,
    showForm,
    isClosing,
    editingItem: editingAgency,
    handleChange,
    handleSubmit: baseHandleSubmit,
    handleEdit,
    handleDelete: baseHandleDelete,
    handleToggleActive: baseHandleToggleActive,
    handleNew,
    resetForm,
    setItems: setAgencies,
    loadItems
  } = useResourceManager("/api/agencies", {
    initialFormData: { name: "", isDefault: false },
    validate: (data) => {
      const newErrors = {};
      if (!data.name.trim()) {
        newErrors.name = "Agency name is required";
      }
      return newErrors;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name,
      isDefault: data.isDefault,
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    updateItem: (existingAgency, data, now) => ({
      ...existingAgency,
      ...data,
      updatedAt: now
    }),
    hasActiveToggle: true
  });

  // Helper to update a single agency via PUT
  const updateAgencyApi = async (agency) => {
    const response = await fetch("/api/agencies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agency),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to update agency");
    }
    return result;
  };

  // Helper to create a new agency via POST
  const createAgencyApi = async (agency) => {
    const response = await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agency),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to create agency");
    }
    return result;
  };

  // Custom submit handler to handle default agency logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name.trim()) {
      return;
    }

    const now = new Date().toISOString();

    try {
      if (editingAgency) {
        // Update existing agency
        const updatedAgency = { ...editingAgency, ...formData, updatedAt: now };
        await updateAgencyApi(updatedAgency);

        // If setting this as default, unset others
        if (formData.isDefault) {
          for (const a of agencies) {
            if (a.id !== editingAgency.id && a.isDefault) {
              await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
            }
          }
        }
      } else {
        // Create new agency
        const newAgency = {
          id: Date.now().toString(),
          name: formData.name,
          isDefault: formData.isDefault,
          active: true,
          createdAt: now,
          updatedAt: now,
        };

        // If setting as default, unset others first
        if (formData.isDefault) {
          for (const a of agencies) {
            if (a.isDefault) {
              await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
            }
          }
        }

        await createAgencyApi(newAgency);
      }

      // Reload agencies and reset form
      await loadItems();
      resetForm();
    } catch (error) {
      console.error("Error saving agency:", error);
    }
  };

  // Custom delete handler to prevent deleting default agency
  const handleDelete = async (id) => {
    const agencyToDelete = agencies.find(a => a.id === id);

    // Prevent deleting the default agency
    if (agencyToDelete?.isDefault) {
      alert("Cannot delete the default agency. Please set another agency as default first.");
      return;
    }

    await baseHandleDelete(id, "Are you sure you want to delete this agency?");
  };

  // Custom toggle handler to prevent deactivating default agency
  const handleToggleActive = async (agency) => {
    // Prevent deactivating the default agency
    if (agency.isDefault && agency.active) {
      alert("Cannot deactivate the default agency. Please set another agency as default first.");
      return;
    }

    await baseHandleToggleActive(agency);
  };

  // Custom handler for setting default agency
  const handleSetDefault = async (agency) => {
    if (!confirm(`Set "${agency.name}" as the default agency?`)) return;

    const now = new Date().toISOString();

    try {
      // Unset current default
      for (const a of agencies) {
        if (a.isDefault && a.id !== agency.id) {
          await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
        }
      }

      // Set new default (and ensure it's active)
      await updateAgencyApi({
        ...agency,
        isDefault: true,
        active: true,
        updatedAt: now
      });

      // Reload agencies
      await loadItems();
    } catch (error) {
      console.error("Error setting default agency:", error);
    }
  };

  return (
    <div className={styles.agencyManager}>
      {isLoading ? (
        <div className={styles.loadingState}>Loading agencies...</div>
      ) : (
        <>
          {showForm && (
            <div className={`${styles.agencyFormSection} ${isClosing ? styles.closing : ''}`}>
              <div className={styles.formHeader}>
                <h2>{editingAgency ? "Edit Agency" : "Add New Agency"}</h2>
                <button
                  type="button"
                  className={styles.btnClose}
                  onClick={resetForm}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className={styles.agencyForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Agency Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., R&R Partners"
                    className={errors.name ? "error" : ""}
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                    Set as Default Agency
                  </label>
                  <span className={styles.helpText}>
                    The default agency will be auto-selected for new ISCI codes
                  </span>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.btnCancel} onClick={resetForm}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnSubmit}>
                    {editingAgency ? "Update" : "Add"} Agency
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className={styles.agenciesListSection}>
            <div className={styles.listHeader}>
              <h2>All Agencies ({agencies.length})</h2>
              {!showForm && (
                <button
                  className={styles.btnAddNew}
                  onClick={handleNew}
                >
                  + Add New Agency
                </button>
              )}
            </div>
            {agencies.length === 0 ? (
              <p className={styles.emptyState}>No agencies yet. Add your first one above!</p>
            ) : (
              <div className={styles.agenciesTableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Agency Name</th>
                      <th>Default</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agencies.map(agency => (
                      <tr key={agency.id} className={!agency.active ? "inactive" : ""}>
                        <td>{agency.name}</td>
                        <td>
                          {agency.isDefault ? (
                            <span className={styles.defaultBadge}>Default</span>
                          ) : (
                            <button
                              className={styles.btnSetDefault}
                              onClick={() => handleSetDefault(agency)}
                              title="Set as default"
                            >
                              Set As Default
                            </button>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${agency.active ? styles.active : styles.inactive}`}>
                            {agency.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{new Date(agency.createdAt).toLocaleDateString()}</td>
                        <td className={styles.actionsCell}>
                          <button
                            className={styles.btnEdit}
                            onClick={() => handleEdit(agency)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className={styles.btnToggle}
                            onClick={() => handleToggleActive(agency)}
                            title={agency.active ? "Deactivate" : "Activate"}
                          >
                            {agency.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className={styles.btnDelete}
                            onClick={() => handleDelete(agency.id)}
                            title="Delete"
                            disabled={agency.isDefault}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AgencyManager;
