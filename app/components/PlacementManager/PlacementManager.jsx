import { useRef, useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog, useFetchData } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import { IconSearch, IconLock, IconEdit, IconTrash, IconWarn } from "@/components/Icons";
import { MEDIA_TYPES } from "@/utils/isci";
import styles from "./PlacementManager.module.scss";

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

const mediaTypeLabel = (value) => MEDIA_TYPES.find((m) => m.value === value)?.label || "";

const PlacementManager = () => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const pendingDeleteRef = useRef(null);

  const { data: isciCodes } = useFetchData("/api/isci");

  const countByPlacementId = useMemo(
    () => isciCodes.reduce((acc, c) => { acc[c.placementId] = (acc[c.placementId] || 0) + 1; return acc; }, {}),
    [isciCodes]
  );

  const {
    items: placements,
    formData,
    errors,
    isLoading,
    showForm,
    editingItem: editingPlacement,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleNew,
    resetForm,
  } = useResourceManager("/api/placements", {
    initialFormData: { name: "", mediaType: "D" },
    validate: (data, list, editing) => {
      const e = {};
      if (!data.name.trim()) e.name = "Placement name is required";
      if (!MEDIA_TYPES.some((m) => m.value === data.mediaType)) e.mediaType = "Choose a media type";
      return e;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name.trim(),
      mediaType: data.mediaType,
      active: true,
      createdAt: now,
      updatedAt: now,
    }),
    hasActiveToggle: true,
    confirmDelete: async () => {
      const p = pendingDeleteRef.current;
      const count = countByPlacementId[p?.id] || 0;
      if (count > 0) {
        await confirm({
          title: "Cannot Delete Placement",
          message: `${p?.name} (${p?.mediaType}) has ${count} ISCI code${count !== 1 ? "s" : ""} referencing it and cannot be deleted. Deactivate it to hide it from new ISCI creation.`,
          confirmText: "Got it",
          isDangerous: false,
        });
        return false;
      }
      return confirm({
        title: "Delete Placement",
        message: `Delete ${p?.name} (${p?.mediaType})? This can't be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        isDangerous: true,
      });
    },
  });

  const doDelete = (placement) => {
    if (showForm) resetForm();
    pendingDeleteRef.current = placement;
    handleDelete(placement);
  };

  const mediaTypeLocked = !!editingPlacement && (countByPlacementId[editingPlacement.id] || 0) > 0;
  const activeCount = placements.filter((p) => p.active).length;
  const inactiveCount = placements.length - activeCount;

  const filteredPlacements = useMemo(() => {
    let list = placements;
    if (filter === "active") list = list.filter((p) => p.active);
    if (filter === "inactive") list = list.filter((p) => !p.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || mediaTypeLabel(p.mediaType).toLowerCase().includes(q)
      );
    }
    return list;
  }, [placements, filter, search]);

  return (
    <div className={styles.brandManager}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Placements</h1>
          <p className={styles.pgSub}>
            <strong>{filteredPlacements.length}</strong> of {placements.length}
            {" · "}
            <strong>{activeCount}</strong> active
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => handleNew()}>
          + New Placement
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search placement name or media type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {[
            { id: "all", label: "All", count: placements.length },
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
          <div className={styles.emptyState}><p>Loading placements…</p></div>
        ) : filteredPlacements.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No placements {search || filter !== "all" ? "match" : "yet"}</h3>
            <p>
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Create your first placement to start generating ISCI codes."}
            </p>
            {!search && filter === "all" && (
              <button type="button" className="btn-primary" onClick={() => handleNew()}>
                + New Placement
              </button>
            )}
          </div>
        ) : (
          <div className={styles.cards}>
            {filteredPlacements.map((placement) => {
              const count = countByPlacementId[placement.id] || 0;
              return (
                <article
                  key={placement.id}
                  className={`${styles.card} ${!placement.active ? styles.cardInactive : ""}`}
                >
                  <div className={styles.cardTop}>
                    <div className={`${styles.dot} ${styles.tileAccent}`}>{placement.mediaType}</div>
                    <div className={styles.cardInfo}>
                      <h3>{placement.name}</h3>
                      <div className={styles.cardSub}>
                        <span className={styles.codeTag}>{placement.mediaType}</span>
                        {count > 0 && (
                          <>
                            <span className={styles.sep}>·</span>
                            <span className={styles.codeCount}>{count} code{count !== 1 ? "s" : ""}</span>
                            <span className={styles.lockIcon} title="Media type locked, ISCI codes reference this placement">
                              <IconLock />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${placement.active ? styles.statusActive : styles.statusInactive}`}>
                      <span className={styles.statusDot} />
                      {placement.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.createdDate}>Created {fmtDate(placement.createdAt)}</span>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        title="Edit"
                        className="btn-icon"
                        onClick={() => handleEdit(placement)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="btn-icon btn-icon-danger"
                        onClick={() => doDelete(placement)}
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
        title={editingPlacement ? "Edit Placement" : "New Placement"}
        subtitle={
          editingPlacement
            ? `${editingPlacement.mediaType} · ${countByPlacementId[editingPlacement.id] || 0} ISCI code${(countByPlacementId[editingPlacement.id] || 0) !== 1 ? "s" : ""}`
            : "Add a new placement category"
        }
        footer={
          <>
            <div>
              {editingPlacement && (
                <button type="button" className="btn-danger" onClick={() => doDelete(editingPlacement)}>
                  <IconTrash /> Delete
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSubmit}>
                {editingPlacement ? "Save Changes" : "Create Placement"}
              </button>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="pm-name">Placement name <span className={styles.req}>*</span></label>
            <input
              type="text"
              id="pm-name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g. Broadcast"
              className={errors.name ? styles.inputError : ""}
              autoFocus
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="pm-mediaType">
              Media type <span className={styles.req}>*</span>
              {mediaTypeLocked && (
                <span className={styles.lockedLabel}>
                  <IconLock /> Locked
                </span>
              )}
            </label>
            <select
              id="pm-mediaType"
              name="mediaType"
              value={formData.mediaType || "D"}
              onChange={handleChange}
              disabled={mediaTypeLocked}
              className={errors.mediaType ? styles.inputError : ""}
            >
              {MEDIA_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label} · {m.value}</option>
              ))}
            </select>
            {errors.mediaType && <span className={styles.fieldError}>{errors.mediaType}</span>}
            {!errors.mediaType && (
              <span className={styles.fieldHint}>
                {mediaTypeLocked
                  ? `Locked, ${countByPlacementId[editingPlacement?.id] || 0} ISCI code${(countByPlacementId[editingPlacement?.id] || 0) !== 1 ? "s" : ""} use this media type.`
                  : "4th character of every ISCI code created against this placement (T broadcast, D digital, R radio). Locks once the first code is created."}
              </span>
            )}
            {mediaTypeLocked && (
              <div className={styles.lockWarn}>
                <IconWarn />
                <div>
                  <strong>Why it&apos;s locked:</strong> changing the media type would invalidate{" "}
                  {countByPlacementId[editingPlacement?.id] || 0} existing ISCI code
                  {(countByPlacementId[editingPlacement?.id] || 0) !== 1 ? "s" : ""}.
                  The name and status are still editable.
                </div>
              </div>
            )}
          </div>

          {editingPlacement && (
            <div className={styles.rowSwitch}>
              <div>
                <div className={styles.switchTitle}>Status</div>
                <div className={styles.switchHint}>
                  {editingPlacement.active
                    ? "Visible in new ISCI dropdowns"
                    : "Hidden from new ISCI dropdowns. Existing codes unaffected."}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleTrack} ${editingPlacement.active ? styles.toggleOn : ""}`}
                onClick={() => handleToggleActive(editingPlacement)}
                aria-pressed={editingPlacement.active}
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

export default PlacementManager;
