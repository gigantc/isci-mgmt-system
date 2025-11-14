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
    saveItems
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

  // Custom submit handler to handle default agency logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = new Date().toISOString();
    let updatedAgencies;

    if (editingAgency) {
      // Update existing agency
      updatedAgencies = agencies.map(a => {
        if (a.id === editingAgency.id) {
          return { ...a, ...formData, updatedAt: now };
        }
        // If setting this as default, unset others
        if (formData.isDefault && a.isDefault) {
          return { ...a, isDefault: false, updatedAt: now };
        }
        return a;
      });
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

      // If setting as default, unset others
      if (formData.isDefault) {
        updatedAgencies = agencies.map(a => ({ ...a, isDefault: false, updatedAt: now }));
        updatedAgencies.push(newAgency);
      } else {
        updatedAgencies = [...agencies, newAgency];
      }
    }

    const success = await saveItems(updatedAgencies);
    if (success) {
      resetForm();
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

    const updatedAgencies = agencies.map(a => ({
      ...a,
      isDefault: a.id === agency.id,
      // Ensure default agency is active
      active: a.id === agency.id ? true : a.active,
      updatedAt: new Date().toISOString()
    }));

    await saveItems(updatedAgencies);
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
