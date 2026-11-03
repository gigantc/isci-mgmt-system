import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ISCIList from "@/components/ISCIList";
import FamilyCards from "@/components/FamilyCards";
import ConfirmDialog from "@/components/ConfirmDialog";
import BulkEditDrawer from "@/components/BulkEditDrawer";
import { canEdit } from "@/utils/auth";
import { useFetchData, useConfirmDialog, useSession } from "@/hooks";
import { rankByFuzzy } from "@/utils/fuzzy";
import { colorForCode } from "@/utils/palette";
import { GROUP_OPTIONS } from "@/utils/grouping";
import styles from "./Dashboard.module.scss";

const DENSITY_KEY = "isciz-density";
const GROUP_KEY = "isciz-group";

const Dashboard = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [density, setDensity] = useState("comfy");
  const [densityReady, setDensityReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [group, setGroup] = useState("family"); // default; "none" | a key of GROUP_MODES (stored choice applied in an effect)
  const [navCodes, setNavCodes] = useState([]); // rows in display order, reported by the table
  const [view, setView] = useState("all"); // "all" | "mine"
  const [clientFilter, setClientFilter] = useState(null);
  const [placementFilter, setPlacementFilter] = useState(null);
  const searchInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Bulk selection (checkbox column). Holds ids; pruned to the visible rows below.
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkIds, setBulkIds] = useState(null); // ids shown in the bulk editor, or null when closed
  const urlSelectionApplied = useRef(false);

  const { data: codes, loading: isLoading, refetch: loadCodes, setData: setCodes } = useFetchData("/api/isci");
  const { dialogProps, confirm } = useConfirmDialog();

  const { user: sessionUser, ready, canEdit: userCanEdit } = useSession();

  useEffect(() => {
    if (ready && !sessionUser) navigate("/login");
  }, [navigate, ready, sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedGroup = window.localStorage.getItem(GROUP_KEY);
      if (GROUP_OPTIONS.some(([id]) => id === storedGroup)) setGroup(storedGroup);
    } catch {
      // storage unavailable: keep the default (Family)
    }
    const stored = window.localStorage.getItem(DENSITY_KEY);
    if (stored === "comfy" || stored === "compact") setDensity(stored);
    // Enable the thumb transition only after the stored value is painted, so
    // the thumb doesn't slide on page load.
    const raf = requestAnimationFrame(() => setDensityReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const updateDensity = (next) => {
    setDensity(next);
    if (typeof window !== "undefined") window.localStorage.setItem(DENSITY_KEY, next);
  };

  const updateGroup = (next) => {
    setGroup(next);
    // Checkboxes only exist in the table; cards use Edit family / Edit job.
    setSelectedIds(new Set());
    setSelectedIndex(-1);
    try {
      window.localStorage.setItem(GROUP_KEY, next);
    } catch {
      // storage unavailable: the choice just won't persist
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) loadCodes({ silent: true });
    };
    const handleFocus = () => loadCodes({ silent: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadCodes]);

  const handleDeleteCode = async (id) => {
    const confirmed = await confirm({
      title: "Delete ISCI Code",
      message: "Are you sure you want to delete this ISCI code? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      isDangerous: true,
    });
    if (!confirmed) return;
    try {
      const response = await fetch("/api/isci", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        loadCodes();
      } else {
        console.error("Failed to delete ISCI code:", result.error);
      }
    } catch (error) {
      console.error("Error deleting ISCI code:", error);
    }
  };

  const currentUserName = sessionUser ? `${sessionUser.firstName} ${sessionUser.lastName}` : null;

  // Group counts for sidebar (based on unfiltered codes so counts don't collapse)
  const { byClient, byPlacement } = useMemo(() => {
    const bc = new Map();
    const bp = new Map();
    for (const c of codes) {
      if (!bc.has(c.brand)) bc.set(c.brand, { count: 0, color: c.brandColor || null, codeKey: c.brandCode || c.brand });
      bc.get(c.brand).count += 1;
      if (c.placement?.name) bp.set(c.placement.name, (bp.get(c.placement.name) || 0) + 1);
    }
    return {
      byClient: [...bc.entries()].sort((a, b) => b[1].count - a[1].count),
      byPlacement: [...bp.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [codes]);

  const scoped = useMemo(() => {
    let list = codes;
    if (view === "mine" && currentUserName) {
      list = list.filter((c) => c.createdBy === currentUserName || c.updatedBy === currentUserName);
    }
    if (clientFilter) list = list.filter((c) => c.brand === clientFilter);
    if (placementFilter) list = list.filter((c) => c.placement?.name === placementFilter);
    return list;
  }, [codes, view, clientFilter, placementFilter, currentUserName]);

  const filteredCodes = rankByFuzzy(scoped, searchTerm, [
    "code",
    "brand",
    "campaignName",
    "spotTitle",
    "assignedEditor",
    "jobNumber",
  ]);

  // A selection that arrives in the URL (?select=id,id&edit=1, from the Detail page
  // shortcuts) is applied once, after the codes load, so it works on reload.
  useEffect(() => {
    if (isLoading || urlSelectionApplied.current) return;
    urlSelectionApplied.current = true;
    const wanted = (searchParams.get("select") || "").split(",").filter(Boolean);
    if (wanted.length === 0) return;
    const known = new Set(codes.map((c) => c.id));
    const ids = wanted.filter((id) => known.has(id));
    if (ids.length === 0) return;
    // The selection lives in the table, so leave card mode (without saving that choice).
    setGroup("none");
    setSelectedIds(new Set(ids));
    if (searchParams.get("edit") === "1") setBulkIds(ids);
  }, [isLoading, codes, searchParams]);

  // Selection survives filter changes only for rows that are still visible.
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const visible = new Set(filteredCodes.map((c) => c.id));
    if ([...selectedIds].every((id) => visible.has(id))) return;
    setSelectedIds(new Set([...selectedIds].filter((id) => visible.has(id))));
  }, [filteredCodes, selectedIds]);

  const bulkCodes = useMemo(() => (bulkIds ? codes.filter((c) => bulkIds.includes(c.id)) : []), [codes, bulkIds]);

  const handleBulkApplied = (updated) => {
    const byId = new Map(updated.map((c) => [c.id, c]));
    setCodes((prev) => prev.map((c) => byId.get(c.id) || c));
  };

  const clearFilters = () => {
    setView("all");
    setClientFilter(null);
    setPlacementFilter(null);
  };

  // Clear keyboard selection when the filtered list changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm, codes.length]);

  // Keyboard nav: ↑/↓ move selection, Enter opens detail, E edit, N new
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      // Allow arrow/enter nav when search input is focused (handy), but skip letter keys
      const isSearch = target === searchInputRef.current;
      // Row navigation only exists in the table.
      if (group !== "none" && e.key !== "n" && e.key !== "N") return;

      if (e.key === "ArrowDown" && (!isEditable || isSearch)) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(navCodes.length - 1, 0)));
      } else if (e.key === "ArrowUp" && (!isEditable || isSearch)) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && (!isEditable || isSearch)) {
        const chosen = navCodes[selectedIndex];
        if (chosen) {
          e.preventDefault();
          navigate(`/isci/${chosen.code}`);
        }
      } else if (!isEditable && e.key === " " && canEdit()) {
        const chosen = navCodes[selectedIndex];
        if (chosen) {
          e.preventDefault();
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(chosen.id)) next.delete(chosen.id);
            else next.add(chosen.id);
            return next;
          });
        }
      } else if (!isEditable && (e.key === "e" || e.key === "E")) {
        const chosen = navCodes[selectedIndex];
        if (chosen && canEdit()) {
          e.preventDefault();
          navigate(`/edit/${chosen.code}`);
        }
      } else if (!isEditable && (e.key === "n" || e.key === "N")) {
        if (canEdit()) {
          e.preventDefault();
          navigate("/create");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navCodes, selectedIndex, navigate, group]);

  const noFiltersActive = view === "all" && !clientFilter && !placementFilter;

  return (
    <div className={styles.isciDashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>Views</div>
          <button
            type="button"
            className={`${styles.sbItem} ${noFiltersActive ? styles.sbItemOn : ""}`}
            onClick={clearFilters}
          >
            <span>All codes</span>
            <span className={styles.sbCount}>{codes.length}</span>
          </button>
          {currentUserName && (
            <button
              type="button"
              className={`${styles.sbItem} ${view === "mine" ? styles.sbItemOn : ""}`}
              onClick={() => setView(view === "mine" ? "all" : "mine")}
            >
              <span>Mine</span>
              <span className={styles.sbCount}>
                {codes.filter((c) => c.createdBy === currentUserName || c.updatedBy === currentUserName).length}
              </span>
            </button>
          )}
        </div>

        {byClient.length > 0 && (
          <div className={styles.sbGroup}>
            <div className={styles.sbLabel}>Clients</div>
            {byClient.map(([name, info]) => (
              <button
                key={name}
                type="button"
                className={`${styles.sbItem} ${clientFilter === name ? styles.sbItemOn : ""}`}
                onClick={() => setClientFilter(clientFilter === name ? null : name)}
              >
                <span className={styles.sbItemLabel}>
                  <span
                    className={styles.sbDot}
                    style={{ background: info.color || colorForCode(info.codeKey) }}
                  />
                  {name}
                </span>
                <span className={styles.sbCount}>{info.count}</span>
              </button>
            ))}
          </div>
        )}

        {byPlacement.length > 0 && (
          <div className={styles.sbGroup}>
            <div className={styles.sbLabel}>Placement</div>
            {byPlacement.map(([name, n]) => (
              <button
                key={name}
                type="button"
                className={`${styles.sbItem} ${placementFilter === name ? styles.sbItemOn : ""}`}
                onClick={() => setPlacementFilter(placementFilter === name ? null : name)}
              >
                <span>{name}</span>
                <span className={styles.sbCount}>{n}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className={styles.main}>
      <header className={styles.pgHead}>
        <div>
          <h1>Dashboard</h1>
          <p className={styles.pgSub}>
            <strong>{codes.length}</strong> {codes.length === 1 ? "code" : "codes"}
            {searchTerm ? ` · ${filteredCodes.length} matching` : ""}
          </p>
        </div>

        {/* Overlays the header so selecting rows never shifts the list. */}
        {userCanEdit && selectedIds.size > 0 && (
          <div className={styles.selectionBar} role="region" aria-label="Selection">
            <span className={styles.selectionCount}>{selectedIds.size} selected</span>
            <button type="button" className="btn-primary" onClick={() => setBulkIds([...selectedIds])}>
              Edit {selectedIds.size} {selectedIds.size === 1 ? "code" : "codes"}
            </button>
            <button type="button" className="btn-text" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        )}
      </header>

      {!isLoading && (
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search code, client, campaign, spot title…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <div className={styles.groupBy} role="group" aria-label="View">
            {GROUP_OPTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={group === id ? styles.groupOn : ""}
                onClick={() => updateGroup(id)}
                aria-pressed={group === id}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className={`${styles.density} ${density === "compact" ? styles.densityCompact : ""} ${densityReady ? styles.densityReady : ""}`}
            role="group"
            aria-label="Row density"
          >
            <button
              type="button"
              className={density === "comfy" ? styles.densityOn : ""}
              onClick={() => updateDensity("comfy")}
              aria-label="Comfy rows"
              title="Comfy"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
            <button
              type="button"
              className={density === "compact" ? styles.densityOn : ""}
              onClick={() => updateDensity("compact")}
              aria-label="Compact rows"
              title="Compact"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="3" y1="14" x2="21" y2="14" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          {userCanEdit && (
            <button
              type="button"
              className={`btn-primary ${styles.newCode}`}
              onClick={() => navigate("/create")}
            >
              + New ISCI Code
            </button>
          )}
        </div>
      )}

      <div className={styles.scrollableContent}>
        {isLoading ? (
          <div className={styles.loadingState}>Loading…</div>
        ) : (
          group === "none" ? (
            <ISCIList
              codes={filteredCodes}
              onNavChange={setNavCodes}
              onDelete={handleDeleteCode}
              density={density}
              selectedIndex={selectedIndex}
              selectable={userCanEdit}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          ) : (
            <FamilyCards
              codes={filteredCodes}
              allCodes={codes}
              mode={group}
              canEdit={userCanEdit}
              onEdit={setBulkIds}
              density={density}
            />
          )
        )}
      </div>

      {!isLoading && (
        <footer className={styles.footer}>
          <div>
            {filteredCodes.length} {filteredCodes.length === 1 ? "row" : "rows"}
            {selectedIndex >= 0 ? " · 1 selected" : ""}
          </div>
          <div className={styles.footerShortcuts}>
            {group === "none" && (
              <>
                <kbd>↑↓</kbd> navigate
                <kbd>⏎</kbd> view
                {userCanEdit && (<><kbd>E</kbd> edit <kbd>N</kbd> new <kbd>Space</kbd> select</>)}
              </>
            )}
            {group !== "none" && userCanEdit && (<><kbd>N</kbd> new</>)}
            <kbd>⌘K</kbd> palette
          </div>
        </footer>
      )}
      </main>

      <BulkEditDrawer
        open={!!bulkIds && bulkCodes.length > 0}
        onClose={() => setBulkIds(null)}
        codes={bulkCodes}
        userName={currentUserName}
        onApplied={handleBulkApplied}
      />

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Dashboard;
