import { useRef, useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import styles from "./AgencyManager.module.scss";

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
  </svg>
);
const IconBuild = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>
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

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

const AgencyManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const pendingDeleteRef = useRef(null);

  const {
    items: agencies,
    formData,
    errors,
    isLoading,
    showForm,
    editingItem: editingAgency,
    handleChange,
    handleEdit,
    handleDelete,
    handleToggleActive: baseHandleToggleActive,
    handleNew,
    resetForm,
    loadItems,
  } = useResourceManager("/api/agencies", {
    initialFormData: { name: "", isDefault: false },
    validate: (data) => {
      const e = {};
      if (!data.name.trim()) e.name = "Agency name is required";
      return e;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name,
      isDefault: data.isDefault,
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    updateItem: (existing, data, now) => ({ ...existing, ...data, updatedAt: now }),
    hasActiveToggle: true,
    confirmDelete: async () => {
      const agency = pendingDeleteRef.current;
      if (agency?.isDefault) {
        await confirm({
          title: "Cannot Delete Default Agency",
          message: `"${agency?.name}" is the default agency. Promote another agency to default before deleting this one.`,
          confirmText: "Got it",
          isDangerous: false,
        });
        return false;
      }
      return confirm({
        title: "Delete Agency",
        message: `Delete "${agency?.name}"? This can't be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        isDangerous: true,
      });
    },
  });

  const updateAgencyApi = async (agency) => {
    const res = await fetch("/api/agencies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agency),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Failed to update agency");
    return result;
  };

  const createAgencyApi = async (agency) => {
    const res = await fetch("/api/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agency),
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Failed to create agency");
    return result;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.name.trim()) return;

    const now = new Date().toISOString();
    try {
      if (editingAgency) {
        await updateAgencyApi({ ...editingAgency, ...formData, updatedAt: now });
        if (formData.isDefault) {
          for (const a of agencies) {
            if (a.id !== editingAgency.id && a.isDefault) {
              await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
            }
          }
        }
      } else {
        const newAgency = {
          id: Date.now().toString(),
          name: formData.name,
          isDefault: formData.isDefault,
          active: true,
          createdAt: now,
          updatedAt: now,
        };
        if (formData.isDefault) {
          for (const a of agencies) {
            if (a.isDefault) {
              await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
            }
          }
        }
        await createAgencyApi(newAgency);
      }
      await loadItems();
      resetForm();
    } catch (err) {
      console.error("Error saving agency:", err);
    }
  };

  const handleToggleActive = async (agency) => {
    if (agency.isDefault && agency.active) {
      await confirm({
        title: "Can't deactivate default",
        message: "Promote another agency to default before deactivating this one.",
        confirmText: "OK",
        cancelText: "",
      });
      return;
    }
    await baseHandleToggleActive(agency);
  };

  const doDelete = (agency) => {
    if (showForm) resetForm();
    pendingDeleteRef.current = agency;
    handleDelete(agency);
  };

  const activeCount = agencies.filter((a) => a.active).length;
  const inactiveCount = agencies.length - activeCount;
  const defaultAgency = agencies.find((a) => a.isDefault);

  const filteredAgencies = useMemo(() => {
    let list = agencies;
    if (filter === "active") list = list.filter((a) => a.active);
    if (filter === "inactive") list = list.filter((a) => !a.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [agencies, filter, search]);

  return (
    <div className={styles.agencyManager}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Agencies</h1>
          <p className={styles.pgSub}>
            <strong>{filteredAgencies.length}</strong> of {agencies.length}
            {" · "}
            <strong>{activeCount}</strong> active
            {defaultAgency && (
              <> · default: <strong>{defaultAgency.name}</strong></>
            )}
          </p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
          + New Agency
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search agencies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {[
            { id: "all", label: "All", count: agencies.length },
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
          <div className={styles.emptyState}><p>Loading agencies…</p></div>
        ) : filteredAgencies.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No agencies {search || filter !== "all" ? "match" : "yet"}</h3>
            <p>
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Add an agency so it can be selected when creating ISCI codes."}
            </p>
            {!search && filter === "all" && (
              <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
                + New Agency
              </button>
            )}
          </div>
        ) : (
          <div className={styles.cards}>
            {filteredAgencies.map((agency) => (
              <article
                key={agency.id}
                className={`${styles.card} ${!agency.active ? styles.cardInactive : ""}`}
              >
                {agency.isDefault && (
                  <span className={styles.favStar} title="Default agency">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </span>
                )}
                <div className={styles.cardTop}>
                  <div className={styles.agencyIcon}>
                    <IconBuild />
                  </div>
                  <div className={styles.cardInfo}>
                    <h3 style={{ paddingRight: agency.isDefault ? "1.25rem" : 0 }}>{agency.name}</h3>
                    <div className={styles.cardSub}>
                      {agency.isDefault
                        ? <span className={styles.defaultTag}>Default · pre-selected on new ISCIs</span>
                        : <span className={styles.partnerTag}>Partner agency</span>
                      }
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${agency.active ? styles.statusActive : styles.statusInactive}`}>
                    <span className={styles.statusDot} />
                    {agency.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.createdDate}>Created {fmtDate(agency.createdAt)}</span>
                  <div className={styles.rowActions}>
                    <button
                      type="button"
                      title="Edit"
                      className={styles.actionBtn}
                      onClick={() => handleEdit(agency)}
                    >
                      <IconEdit />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => doDelete(agency)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Drawer
        open={showForm}
        onClose={resetForm}
        title={editingAgency ? "Edit Agency" : "New Agency"}
        subtitle={
          editingAgency
            ? editingAgency.isDefault ? "Default agency" : "Partner agency"
            : "Add a new partner agency"
        }
        footer={
          <>
            <div>
              {editingAgency && (
                <button type="button" className={styles.btnDanger} onClick={() => doDelete(editingAgency)}>
                  <IconTrash /> Delete
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>
                {editingAgency ? "Save Changes" : "Create Agency"}
              </button>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="am-name">Agency Name <span className={styles.req}>*</span></label>
            <input
              type="text"
              id="am-name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g., R&R Partners"
              className={errors.name ? styles.inputError : ""}
              autoFocus
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.rowSwitch}>
            <div>
              <div className={styles.switchTitle}>Default agency</div>
              <div className={styles.switchHint}>
                {formData.isDefault
                  ? "Pre-selected on all new ISCI codes."
                  : "Not pre-selected."}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggleTrack} ${formData.isDefault ? styles.toggleOn : ""}`}
              onClick={() =>
                handleChange({ target: { name: "isDefault", type: "checkbox", checked: !formData.isDefault } })
              }
              aria-pressed={formData.isDefault}
              aria-label="Toggle default agency"
            />
          </div>

          {editingAgency && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Status</div>
                <div className={styles.switchHint}>
                  {editingAgency.isDefault
                    ? "Default agencies can't be deactivated."
                    : editingAgency.active
                    ? "Visible in agency dropdowns"
                    : "Hidden from new ISCI dropdowns. Existing codes unaffected."}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${editingAgency.active ? styles.toggleOn : ""}`}
                onClick={() => handleToggleActive(editingAgency)}
                aria-pressed={editingAgency.active}
                aria-label="Toggle active status"
                disabled={editingAgency.isDefault && editingAgency.active}
              />
            </div>
          )}
        </form>
      </Drawer>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AgencyManager;
