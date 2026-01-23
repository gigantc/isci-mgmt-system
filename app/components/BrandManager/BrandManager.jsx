import { useResourceManager } from "@/hooks";
import styles from "./BrandManager.module.scss";

const BrandManager = () => {
  const {
    items: brands,
    formData,
    errors,
    isLoading,
    showForm,
    isClosing,
    editingItem: editingBrand,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleNew,
    resetForm
  } = useResourceManager("/api/brands", {
    initialFormData: { name: "", abbreviation: "", code: "" },
    validate: (data, brands, editingBrand) => {
      const newErrors = {};

      if (!data.name.trim()) {
        newErrors.name = "Client name is required";
      }

      if (!data.abbreviation.trim()) {
        newErrors.abbreviation = "Client abbreviation is required";
      }

      if (!data.code.trim()) {
        newErrors.code = "Client code is required";
      } else if (!/^[A-Z]{4}$/.test(data.code)) {
        newErrors.code = "Client code must be exactly 4 uppercase letters (e.g., LVCI)";
      } else {
        // Check for duplicate code
        const isDuplicate = brands.some(
          b => b.code === data.code && b.id !== editingBrand?.id
        );
        if (isDuplicate) {
          newErrors.code = "This client code is already in use";
        }
      }

      return newErrors;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name,
      abbreviation: data.abbreviation,
      code: data.code.toUpperCase(),
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    hasActiveToggle: true
  });

  return (
    <div className={styles.brandManager}>
      {isLoading ? (
        <div className={styles.loadingState}>Loading clients...</div>
      ) : (
        <>
      {showForm && (
        <div className={`${styles.brandFormSection} ${isClosing ? styles.closing : ''}`}>
          <div className={styles.formHeader}>
            <h2>{editingBrand ? "Edit Client" : "Add New Client"}</h2>
            <button
              type="button"
              className={styles.btnClose}
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>
        <form onSubmit={handleSubmit} className={styles.brandForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Client Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Las Vegas Convention and Visitors Authority"
                className={errors.name ? "error" : ""}
              />
              {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="abbreviation">Abbreviation *</label>
              <input
                type="text"
                id="abbreviation"
                name="abbreviation"
                value={formData.abbreviation}
                onChange={handleChange}
                placeholder="e.g., LVCVA"
                className={errors.abbreviation ? "error" : ""}
              />
              {errors.abbreviation && <span className={styles.errorMessage}>{errors.abbreviation}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="code">Client Code (4 letters) *</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., LVCR"
                maxLength={4}
                style={{ textTransform: "uppercase" }}
                className={errors.code ? "error" : ""}
              />
              {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnCancel} onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className={styles.btnSubmit}>
              {editingBrand ? "Update" : "Add"} Client
            </button>
          </div>
        </form>
        </div>
      )}

      <div className={styles.brandsListSection}>
        <div className={styles.listHeader}>
          <h2>All Clients ({brands.length})</h2>
          {!showForm && (
            <button
              className={styles.btnAddNew}
              onClick={handleNew}
            >
              + Add New Client
            </button>
          )}
        </div>
        {brands.length === 0 ? (
          <p className={styles.emptyState}>No clients yet. Add your first one above!</p>
        ) : (
          <div className={styles.brandsTableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Abbreviation</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(brand => (
                  <tr key={brand.id} className={!brand.active ? "inactive" : ""}>
                    <td>{brand.name}</td>
                    <td>{brand.abbreviation || "—"}</td>
                    <td className={styles.codeCell}>{brand.code}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${brand.active ? styles.active : styles.inactive}`}>
                        {brand.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(brand.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => handleEdit(brand)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className={styles.btnToggle}
                        onClick={() => handleToggleActive(brand)}
                        title={brand.active ? "Deactivate" : "Activate"}
                      >
                        {brand.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => handleDelete(brand.id)}
                        title="Delete"
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

export default BrandManager;
