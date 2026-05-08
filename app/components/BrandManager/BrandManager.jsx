import { useRef, useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog, useFetchData } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import { colorForCode } from "@/utils/palette";
import styles from "./BrandManager.module.scss";

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>
  </svg>
);
const IconWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 9v4M12 17h.01M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/>
  </svg>
);

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

const BrandManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const pendingDeleteRef = useRef(null);

  const { data: isciCodes } = useFetchData("/api/isci");

  const countByBrandId = useMemo(
    () => isciCodes.reduce((acc, c) => { acc[c.brandId] = (acc[c.brandId] || 0) + 1; return acc; }, {}),
    [isciCodes]
  );

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
    handleDelete,
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
    confirmDelete: async () => {
      const brand = pendingDeleteRef.current;
      const count = countByBrandId[brand?.id] || 0;
      if (count > 0) {
        await confirm({
          title: "Cannot Delete Client",
          message: `${brand?.name} (${brand?.code}) has ${count} ISCI code${count !== 1 ? "s" : ""} referencing it and cannot be deleted. Deactivate it to hide it from new ISCI creation.`,
          confirmText: "Got it",
          isDangerous: false,
        });
        return false;
      }
      return confirm({
        title: "Delete Client",
        message: `Delete ${brand?.name} (${brand?.code})? This can't be undone. Existing ISCI codes are unaffected.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        isDangerous: true,
      });
    },
  });

  const doDelete = (brand) => {
    if (showForm) resetForm();
    pendingDeleteRef.current = brand;
    handleDelete(brand);
  };

  const codeLocked = !!editingBrand && (countByBrandId[editingBrand.id] || 0) > 0;
  const activeCount = brands.filter((b) => b.active).length;
  const inactiveCount = brands.length - activeCount;

  const filteredBrands = useMemo(() => {
    let list = brands;
    if (filter === "active") list = list.filter((b) => b.active);
    if (filter === "inactive") list = list.filter((b) => !b.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) || (b.code || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [brands, filter, search]);

  return (
    <div className={styles.brandManager}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Clients</h1>
          <p className={styles.pgSub}>
            <strong>{filteredBrands.length}</strong> of {brands.length}
            {" · "}
            <strong>{activeCount}</strong> active
          </p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
          + New Client
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search client name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {[
            { id: "all", label: "All", count: brands.length },
            { id: "active", label: "Active", count: activeCount },
            { id: "inactive", label: "Inactive", count: inactiveCount },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              className={`${styles.chip} ${filter === id ? styles.chipOn : ""}`}
              onClick={() => setFilter(id)}
            >
              {label}
              <span className={styles.chipCount}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {isLoading ? (
          <div className={styles.emptyState}><p>Loading clients…</p></div>
        ) : filteredBrands.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No clients {search || filter !== "all" ? "match" : "yet"}</h3>
            <p>
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Create your first client to start generating ISCI codes."}
            </p>
            {!search && filter === "all" && (
              <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
                + New Client
              </button>
            )}
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
                          <>
                            <span className={styles.sep}>·</span>
                            <span className={styles.codeCount}>{count} code{count !== 1 ? "s" : ""}</span>
                            <span className={styles.lockIcon} title="Code locked — ISCI codes reference this client">
                              <IconLock />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${brand.active ? styles.statusActive : styles.statusInactive}`}>
                      <span className={styles.statusDot} />
                      {brand.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.createdDate}>Created {fmtDate(brand.createdAt)}</span>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        title="Edit"
                        className={styles.actionBtn}
                        onClick={() => handleEdit(brand)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => doDelete(brand)}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Drawer
        open={showForm}
        onClose={resetForm}
        title={editingBrand ? "Edit Client" : "New Client"}
        subtitle={
          editingBrand
            ? `${editingBrand.code} · ${countByBrandId[editingBrand.id] || 0} ISCI code${(countByBrandId[editingBrand.id] || 0) !== 1 ? "s" : ""}`
            : "Add a new client organization"
        }
        footer={
          <>
            <div>
              {editingBrand && (
                <button type="button" className={styles.btnDanger} onClick={() => doDelete(editingBrand)}>
                  <IconTrash /> Delete
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>
                {editingBrand ? "Save Changes" : "Create Client"}
              </button>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="bm-name">Client Name <span className={styles.req}>*</span></label>
            <input
              type="text"
              id="bm-name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g. Las Vegas Convention and Visitors Authority"
              className={errors.name ? styles.inputError : ""}
              autoFocus
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="bm-code">
              4-Letter Code <span className={styles.req}>*</span>
              {codeLocked && (
                <span className={styles.lockedLabel}>
                  <IconLock /> LOCKED
                </span>
              )}
            </label>
            <div className={styles.autoField}>
              <input
                type="text"
                id="bm-code"
                name="code"
                value={formData.code || ""}
                onChange={handleChange}
                placeholder="ADID"
                maxLength={4}
                readOnly={codeLocked}
                style={{ textTransform: "uppercase" }}
                className={`${errors.code ? styles.inputError : ""} ${codeLocked ? styles.inputLocked : ""}`}
              />
              {codeLocked && <span className={styles.autoBadge}>LOCKED</span>}
            </div>
            {errors.code && <span className={styles.fieldError}>{errors.code}</span>}
            {!errors.code && (
              <span className={styles.fieldHint}>
                {codeLocked
                  ? `Locked: ${countByBrandId[editingBrand?.id] || 0} ISCI code${(countByBrandId[editingBrand?.id] || 0) !== 1 ? "s" : ""} reference this prefix.`
                  : "Prefix for all ISCI codes. Locks once the first code is created."}
              </span>
            )}
            {codeLocked && (
              <div className={styles.lockWarn}>
                <IconWarn />
                <div>
                  <strong>Why it&apos;s locked:</strong> changing the code would invalidate{" "}
                  {countByBrandId[editingBrand?.id] || 0} existing ISCI code
                  {(countByBrandId[editingBrand?.id] || 0) !== 1 ? "s" : ""} (e.g.{" "}
                  <span className={styles.lockWarnCode}>{editingBrand?.code}2501</span>).
                  The name and status are still editable.
                </div>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="bm-color">Color</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                id="bm-color"
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
                className={`${styles.colorHex} ${errors.color ? styles.inputError : ""}`}
                maxLength={7}
              />
              {formData.color && (
                <button
                  type="button"
                  className={styles.colorReset}
                  onClick={() => handleChange({ target: { name: "color", value: "" } })}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {editingBrand && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Status</div>
                <div className={styles.switchHint}>
                  {editingBrand.active
                    ? "Visible in new ISCI dropdowns"
                    : "Hidden from new ISCI dropdowns. Existing codes unaffected."}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${editingBrand.active ? styles.toggleOn : ""}`}
                onClick={() => handleToggleActive(editingBrand)}
                aria-pressed={editingBrand.active}
                aria-label="Toggle active status"
              />
            </div>
          )}
        </form>
      </Drawer>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default BrandManager;
