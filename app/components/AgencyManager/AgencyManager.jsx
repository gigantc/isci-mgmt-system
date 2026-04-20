import { useState } from "react";
import { useResourceManager, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import styles from "./AgencyManager.module.scss";

const AgencyManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");

  const {
    items: agencies,
    formData,
    errors,
    isLoading,
    showForm,
    editingItem: editingAgency,
    handleChange,
    handleEdit,
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

  const handleSetDefault = async (agency) => {
    const ok = await confirm({
      title: "Set as default agency?",
      message: `"${agency.name}" will become the default agency for new ISCI codes.`,
      confirmText: "Set Default",
      cancelText: "Cancel",
    });
    if (!ok) return;

    const now = new Date().toISOString();
    try {
      for (const a of agencies) {
        if (a.isDefault && a.id !== agency.id) {
          await updateAgencyApi({ ...a, isDefault: false, updatedAt: now });
        }
      }
      await updateAgencyApi({ ...agency, isDefault: true, active: true, updatedAt: now });
      await loadItems();
    } catch (err) {
      console.error("Error setting default agency:", err);
    }
  };

  const filtered = search.trim()
    ? agencies.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : agencies;

  return (
    <div className={styles.agencyManager}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search agencies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn-primary" onClick={handleNew}>
          + New Agency
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>Loading agencies…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No agencies yet</h3>
          <p>Add an agency so it can be selected when creating ISCI codes.</p>
          <button type="button" className="btn-primary" onClick={handleNew}>
            + New Agency
          </button>
        </div>
      ) : (
        <div className={styles.cards}>
          {filtered.map((agency) => (
            <article
              key={agency.id}
              className={`${styles.card} ${!agency.active ? styles.cardInactive : ""}`}
              onClick={() => handleEdit(agency)}
            >
              {agency.isDefault && (
                <span className={styles.favStar} title="Default agency">★</span>
              )}
              <div className={styles.cardTop}>
                <div className={styles.icon}>A</div>
                <div className={styles.cardInfo}>
                  <h3>{agency.name}</h3>
                  <div className={styles.cardSub}>
                    {agency.isDefault ? (
                      <span className={styles.defaultLabel}>Default</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.setDefaultBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(agency);
                        }}
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.createdText}>
                  {new Date(agency.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  className={styles.activeToggle}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(agency);
                  }}
                  aria-pressed={agency.active}
                >
                  <span className={`${styles.toggleTrack} ${agency.active ? styles.toggleOn : ""}`}>
                    <span className={styles.toggleKnob} />
                  </span>
                  <span className={styles.toggleLabel}>
                    {agency.active ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={showForm}
        onClose={resetForm}
        title={editingAgency ? "Edit Agency" : "New Agency"}
        subtitle={editingAgency ? (editingAgency.isDefault ? "Default agency" : "Agency") : "Create a new agency"}
        footer={
          <>
            <button type="button" className="btn-text" onClick={resetForm}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSubmit}>
              {editingAgency ? "Save Changes" : "Create Agency"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="name">Agency Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g., R&R Partners"
              className={errors.name ? styles.inputError : ""}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.rowSwitch}>
            <div>
              <div className={styles.switchTitle}>Default agency</div>
              <div className={styles.switchHint}>
                Auto-selected when creating new ISCI codes.
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggleTrack} ${formData.isDefault ? styles.toggleOn : ""}`}
              onClick={() =>
                handleChange({ target: { name: "isDefault", type: "checkbox", checked: !formData.isDefault } })
              }
              aria-pressed={formData.isDefault}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {editingAgency && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Active</div>
                <div className={styles.switchHint}>
                  {editingAgency.isDefault
                    ? "Default agencies can't be deactivated."
                    : "Inactive agencies are hidden from ISCI creation."}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${editingAgency.active ? styles.toggleOn : ""}`}
                onClick={() => handleToggleActive(editingAgency)}
                aria-pressed={editingAgency.active}
                disabled={editingAgency.isDefault && editingAgency.active}
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

export default AgencyManager;
