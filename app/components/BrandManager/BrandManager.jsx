import { useEffect, useState } from "react";
import { useResourceManager, useConfirmDialog, useFetchData } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import { colorForCode } from "@/utils/palette";
import styles from "./BrandManager.module.scss";

const BrandManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");

  // Load ISCI codes to compute per-brand usage counts / code-lock state
  const { data: isciCodes } = useFetchData("/api/isci");

  const {
    items: brands,
    formData,
    errors,
    isLoading,
    showForm,
    editingItem: editingBrand,
    handleChange,
    handleSubmit,
    handleEdit,
    handleToggleActive,
    handleNew,
    resetForm,
  } = useResourceManager("/api/brands", {
    initialFormData: { name: "", code: "", color: "" },
    validate: (data, list, editing) => {
      const e = {};
      if (!data.name.trim()) e.name = "Client name is required";
      if (!data.code.trim()) {
        e.code = "Client code is required";
      } else if (!/^[A-Z]{4}$/.test(data.code)) {
        e.code = "Must be 4 uppercase letters (e.g., LVCI)";
      } else {
        const dup = list.some((b) => b.code === data.code && b.id !== editing?.id);
        if (dup) e.code = "This client code is already in use";
      }
      return e;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name,
      code: data.code.toUpperCase(),
      color: data.color || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    hasActiveToggle: true,
    confirmDelete: async () =>
      confirm({
        title: "Deactivate Client",
        message: "Deactivate this client? It will stay in the database but won't appear in lookups.",
        confirmText: "Deactivate",
        cancelText: "Cancel",
        isDangerous: true,
      }),
  });

  // Prime drawer for new client
  const openNew = () => handleNew();
  const openEdit = (brand) => handleEdit(brand);

  // Map brandId → ISCI count
  const countByBrandId = isciCodes.reduce((acc, c) => {
    acc[c.brandId] = (acc[c.brandId] || 0) + 1;
    return acc;
  }, {});
  const codeLocked = !!editingBrand && (countByBrandId[editingBrand.id] || 0) > 0;

  const filteredBrands = search.trim()
    ? brands.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          (b.code || "").toLowerCase().includes(q)
        );
      })
    : brands;

  // Lock ESC close if validation errors? No — just close.
  return (
    <div className={styles.brandManager}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn-primary" onClick={openNew}>
          + New Client
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>Loading clients…</div>
      ) : filteredBrands.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No clients yet</h3>
          <p>Create your first client to start generating ISCI codes.</p>
          <button type="button" className="btn-primary" onClick={openNew}>
            + New Client
          </button>
        </div>
      ) : (
        <div className={styles.cards}>
          {filteredBrands.map((brand) => {
            const count = countByBrandId[brand.id] || 0;
            const color = brand.color || colorForCode(brand.code);
            return (
              <article
                key={brand.id}
                className={`${styles.card} ${!brand.active ? styles.cardInactive : ""}`}
                onClick={() => openEdit(brand)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.dot} style={{ background: color }}>
                    {(brand.code || "??").slice(0, 2)}
                  </div>
                  <div className={styles.cardInfo}>
                    <h3>{brand.name}</h3>
                    <div className={styles.cardSub}>
                      <span className={styles.codeTag}>{brand.code}</span>
                      {count > 0 && (
                        <span className={styles.lockHint} title="Code locked: ISCI codes reference this client">
                          🔒
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.countText}>{count} ISCIs</span>
                  <button
                    type="button"
                    className={styles.activeToggle}
                    aria-pressed={brand.active}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(brand);
                    }}
                    title={brand.active ? "Deactivate" : "Activate"}
                  >
                    <span className={`${styles.toggleTrack} ${brand.active ? styles.toggleOn : ""}`}>
                      <span className={styles.toggleKnob} />
                    </span>
                    <span className={styles.toggleLabel}>
                      {brand.active ? "Active" : "Inactive"}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Drawer
        open={showForm}
        onClose={resetForm}
        title={editingBrand ? "Edit Client" : "New Client"}
        subtitle={editingBrand ? editingBrand.code : "Create a client and 4-letter code"}
        footer={
          <>
            <button type="button" className="btn-text" onClick={resetForm}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={(e) => handleSubmit(e)}
            >
              {editingBrand ? "Save Changes" : "Create Client"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="name">Client Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g., Las Vegas Convention and Visitors Authority"
              className={errors.name ? styles.inputError : ""}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="code">
              Code
              {codeLocked && <span className={styles.lockIcon} title="ISCI codes reference this client">🔒</span>}
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code || ""}
              onChange={handleChange}
              placeholder="e.g., LVCR"
              maxLength={4}
              readOnly={codeLocked}
              style={{ textTransform: "uppercase" }}
              className={`${errors.code ? styles.inputError : ""} ${codeLocked ? styles.inputLocked : ""}`}
            />
            {errors.code && <span className={styles.fieldError}>{errors.code}</span>}
            {codeLocked && (
              <div className={styles.lockWarn}>
                <strong>Locked.</strong> ISCI codes already reference this client — changing the
                code would break the {editingBrand?.code}YYNN pattern.
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="color">Color</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color || colorForCode(formData.code || "XXXX")}
                onChange={handleChange}
                className={styles.colorSwatch}
              />
              <input
                type="text"
                name="color"
                value={formData.color || ""}
                onChange={handleChange}
                placeholder={colorForCode(formData.code || "XXXX")}
                className={styles.colorHex}
                maxLength={7}
              />
              {formData.color && (
                <button
                  type="button"
                  className={styles.colorReset}
                  onClick={() => handleChange({ target: { name: "color", value: "" } })}
                  title="Reset to default"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {editingBrand && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Active</div>
                <div className={styles.switchHint}>Inactive clients are hidden from new ISCI creation.</div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${editingBrand.active ? styles.toggleOn : ""}`}
                onClick={() => handleToggleActive(editingBrand)}
                aria-pressed={editingBrand.active}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          )}
        </form>
      </Drawer>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default BrandManager;
