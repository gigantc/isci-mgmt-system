import { useRef, useState, useMemo } from "react";
import { useResourceManager, useConfirmDialog, useFetchData } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import Drawer from "@/components/Drawer";
import styles from "./PlacementManager.module.scss";

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
    initialFormData: { name: "", letter: "" },
    validate: (data, list, editing) => {
      const e = {};
      if (!data.name.trim()) e.name = "Placement name is required";
      const letter = String(data.letter || "").toUpperCase();
      if (!letter) {
        e.letter = "Letter is required";
      } else if (!/^[A-Z]$/.test(letter)) {
        e.letter = "Must be a single uppercase letter (A–Z)";
      } else {
        const dup = list.some((p) => p.letter === letter && p.id !== editing?.id);
        if (dup) e.letter = "This letter is already in use";
      }
      return e;
    },
    createItem: (data, now) => ({
      id: Date.now().toString(),
      name: data.name.trim(),
      letter: String(data.letter).toUpperCase(),
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
          message: `${p?.name} (${p?.letter}) has ${count} ISCI code${count !== 1 ? "s" : ""} referencing it and cannot be deleted. Deactivate it to hide it from new ISCI creation.`,
          confirmText: "Got it",
          isDangerous: false,
        });
        return false;
      }
      return confirm({
        title: "Delete Placement",
        message: `Delete ${p?.name} (${p?.letter})? This can't be undone.`,
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

  const letterLocked = !!editingPlacement && (countByPlacementId[editingPlacement.id] || 0) > 0;
  const activeCount = placements.filter((p) => p.active).length;
  const inactiveCount = placements.length - activeCount;

  const filteredPlacements = useMemo(() => {
    let list = placements;
    if (filter === "active") list = list.filter((p) => p.active);
    if (filter === "inactive") list = list.filter((p) => !p.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) || (p.letter || "").toLowerCase().includes(q)
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
        <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
          + New Placement
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch />
          <input
            type="text"
            placeholder="Search placement name or letter…"
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
              <button type="button" className={styles.btnPrimary} onClick={() => handleNew()}>
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
                    <div className={styles.dot}>{placement.letter}</div>
                    <div className={styles.cardInfo}>
                      <h3>{placement.name}</h3>
                      <div className={styles.cardSub}>
                        <span className={styles.codeTag}>{placement.letter}</span>
                        {count > 0 && (
                          <>
                            <span className={styles.sep}>·</span>
                            <span className={styles.codeCount}>{count} code{count !== 1 ? "s" : ""}</span>
                            <span className={styles.lockIcon} title="Letter locked, ISCI codes reference this placement">
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
                        className={styles.actionBtn}
                        onClick={() => handleEdit(placement)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
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
            ? `${editingPlacement.letter} · ${countByPlacementId[editingPlacement.id] || 0} ISCI code${(countByPlacementId[editingPlacement.id] || 0) !== 1 ? "s" : ""}`
            : "Add a new placement category"
        }
        footer={
          <>
            <div>
              {editingPlacement && (
                <button type="button" className={styles.btnDanger} onClick={() => doDelete(editingPlacement)}>
                  <IconTrash /> Delete
                </button>
              )}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSecondary} onClick={resetForm}>
                Cancel
              </button>
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>
                {editingPlacement ? "Save Changes" : "Create Placement"}
              </button>
            </div>
          </>
        }
      >
        <form onSubmit={handleSubmit} className={styles.drawerForm}>
          <div className={styles.field}>
            <label htmlFor="pm-name">Placement Name <span className={styles.req}>*</span></label>
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
            <label htmlFor="pm-letter">
              Letter <span className={styles.req}>*</span>
              {letterLocked && (
                <span className={styles.lockedLabel}>
                  <IconLock /> LOCKED
                </span>
              )}
            </label>
            <div className={styles.autoField}>
              <input
                type="text"
                id="pm-letter"
                name="letter"
                value={formData.letter || ""}
                onChange={handleChange}
                placeholder="B"
                maxLength={1}
                readOnly={letterLocked}
                style={{ textTransform: "uppercase" }}
                className={`${errors.letter ? styles.inputError : ""} ${letterLocked ? styles.inputLocked : ""}`}
              />
              {letterLocked && <span className={styles.autoBadge}>LOCKED</span>}
            </div>
            {errors.letter && <span className={styles.fieldError}>{errors.letter}</span>}
            {!errors.letter && (
              <span className={styles.fieldHint}>
                {letterLocked
                  ? `Locked, ${countByPlacementId[editingPlacement?.id] || 0} ISCI code${(countByPlacementId[editingPlacement?.id] || 0) !== 1 ? "s" : ""} reference this letter.`
                  : "4th character of every ISCI code created against this placement. Locks once the first code is created."}
              </span>
            )}
            {letterLocked && (
              <div className={styles.lockWarn}>
                <IconWarn />
                <div>
                  <strong>Why it&apos;s locked:</strong> changing the letter would invalidate{" "}
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
