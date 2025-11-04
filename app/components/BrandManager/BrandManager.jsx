import { useState, useEffect } from "react";
import styles from "./BrandManager.module.scss";

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await fetch("/api/brands");
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error loading brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Brand name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Brand code is required";
    } else if (!/^[A-Z]{4}$/.test(formData.code)) {
      newErrors.code = "Brand code must be exactly 4 uppercase letters (e.g., LVCI)";
    } else {
      // Check for duplicate code
      const isDuplicate = brands.some(
        b => b.code === formData.code && b.id !== editingBrand?.id
      );
      if (isDuplicate) {
        newErrors.code = "This brand code is already in use";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const now = new Date().toISOString();
    let updatedBrands;

    if (editingBrand) {
      // Update existing brand
      updatedBrands = brands.map(b =>
        b.id === editingBrand.id
          ? { ...b, ...formData, updatedAt: now }
          : b
      );
    } else {
      // Create new brand
      const newBrand = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code.toUpperCase(),
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      updatedBrands = [...brands, newBrand];
    }

    try {
      await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBrands),
      });
      setBrands(updatedBrands);
      resetForm();
    } catch (error) {
      console.error("Error saving brand:", error);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, code: brand.code });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    const updatedBrands = brands.filter(b => b.id !== id);

    try {
      await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBrands),
      });
      setBrands(updatedBrands);
    } catch (error) {
      console.error("Error deleting brand:", error);
    }
  };

  const handleToggleActive = async (brand) => {
    const updatedBrands = brands.map(b =>
      b.id === brand.id
        ? { ...b, active: !b.active, updatedAt: new Date().toISOString() }
        : b
    );

    try {
      await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBrands),
      });
      setBrands(updatedBrands);
    } catch (error) {
      console.error("Error toggling brand status:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "" });
    setEditingBrand(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  if (isLoading) {
    return <div className={styles.loadingState}>Loading brands...</div>;
  }

  return (
    <div className={styles.brandManager}>
      <div className={styles.brandFormSection}>
        <h2>{editingBrand ? "Edit Brand" : "Add New Brand"}</h2>
        <form onSubmit={handleSubmit} className={styles.brandForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Brand Name *</label>
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
              <label htmlFor="code">Brand Code (4 letters) *</label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., LVCI"
                maxLength={4}
                style={{ textTransform: "uppercase" }}
                className={errors.code ? "error" : ""}
              />
              {errors.code && <span className={styles.errorMessage}>{errors.code}</span>}
            </div>
          </div>

          <div className={styles.formActions}>
            {editingBrand && (
              <button type="button" className={styles.btnCancel} onClick={resetForm}>
                Cancel
              </button>
            )}
            <button type="submit" className={styles.btnSubmit}>
              {editingBrand ? "Update" : "Add"} Brand
            </button>
          </div>
        </form>
      </div>

      <div className={styles.brandsListSection}>
        <h2>All Brands ({brands.length})</h2>
        {brands.length === 0 ? (
          <p className={styles.emptyState}>No brands yet. Add your first one above!</p>
        ) : (
          <div className={styles.brandsTableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Brand Name</th>
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
    </div>
  );
};

export default BrandManager;
