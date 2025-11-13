import { useState, useEffect } from "react";
import styles from "./AgencyManager.module.scss";

const AgencyManager = () => {
  const [agencies, setAgencies] = useState([]);
  const [editingAgency, setEditingAgency] = useState(null);
  const [formData, setFormData] = useState({ name: "", isDefault: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const response = await fetch("/api/agencies");
      const data = await response.json();
      setAgencies(data);
    } catch (error) {
      console.error("Error loading agencies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Agency name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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

    try {
      await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAgencies),
      });
      setAgencies(updatedAgencies);
      resetForm();
    } catch (error) {
      console.error("Error saving agency:", error);
    }
  };

  const handleEdit = (agency) => {
    setEditingAgency(agency);
    setFormData({ name: agency.name, isDefault: agency.isDefault });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const agencyToDelete = agencies.find(a => a.id === id);

    // Prevent deleting the default agency
    if (agencyToDelete?.isDefault) {
      alert("Cannot delete the default agency. Please set another agency as default first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this agency?")) return;

    const updatedAgencies = agencies.filter(a => a.id !== id);

    try {
      await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAgencies),
      });
      setAgencies(updatedAgencies);
    } catch (error) {
      console.error("Error deleting agency:", error);
    }
  };

  const handleToggleActive = async (agency) => {
    // Prevent deactivating the default agency
    if (agency.isDefault && agency.active) {
      alert("Cannot deactivate the default agency. Please set another agency as default first.");
      return;
    }

    const updatedAgencies = agencies.map(a =>
      a.id === agency.id
        ? { ...a, active: !a.active, updatedAt: new Date().toISOString() }
        : a
    );

    try {
      await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAgencies),
      });
      setAgencies(updatedAgencies);
    } catch (error) {
      console.error("Error toggling agency status:", error);
    }
  };

  const handleSetDefault = async (agency) => {
    if (!confirm(`Set "${agency.name}" as the default agency?`)) return;

    const updatedAgencies = agencies.map(a => ({
      ...a,
      isDefault: a.id === agency.id,
      // Ensure default agency is active
      active: a.id === agency.id ? true : a.active,
      updatedAt: new Date().toISOString()
    }));

    try {
      await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAgencies),
      });
      setAgencies(updatedAgencies);
    } catch (error) {
      console.error("Error setting default agency:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", isDefault: false });
    setEditingAgency(null);
    setErrors({});
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className={styles.agencyManager}>
      {isLoading ? (
        <div className={styles.loadingState}>Loading agencies...</div>
      ) : (
        <>
          {showForm && (
            <div className={styles.agencyFormSection}>
              <h2>{editingAgency ? "Edit Agency" : "Add New Agency"}</h2>
              <form onSubmit={handleSubmit} className={styles.agencyForm}>
                <div className={styles.formRow}>
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
                </div>

                <div className={styles.formActions}>
                  {editingAgency && (
                    <button type="button" className={styles.btnCancel} onClick={resetForm}>
                      Cancel
                    </button>
                  )}
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
                  onClick={() => setShowForm(true)}
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
