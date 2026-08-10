import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import ISCIList from "@/components/ISCIList";
import ConfirmDialog from "@/components/ConfirmDialog";
import { isAuthenticated, isAdmin, canEdit, getUserSession } from "@/utils/auth";
import { useFetchData, useConfirmDialog } from "@/hooks";
import { rankByFuzzy } from "@/utils/fuzzy";
import { colorForCode } from "@/utils/palette";
import styles from "./Dashboard.module.scss";

const DENSITY_KEY = "isciz-density";

const Dashboard = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [density, setDensity] = useState("comfy");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [view, setView] = useState("all"); // "all" | "mine"
  const [clientFilter, setClientFilter] = useState(null);
  const [placementFilter, setPlacementFilter] = useState(null);
  const searchInputRef = useRef(null);

  const { data: codes, loading: isLoading, refetch: loadCodes } = useFetchData("/api/isci");
  const { dialogProps, confirm } = useConfirmDialog();

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DENSITY_KEY);
    if (stored === "comfy" || stored === "compact") setDensity(stored);
  }, []);

  const updateDensity = (next) => {
    setDensity(next);
    if (typeof window !== "undefined") window.localStorage.setItem(DENSITY_KEY, next);
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

  const [currentUserName, setCurrentUserName] = useState(null);

  useEffect(() => {
    const u = getUserSession();
    setCurrentUserName(u ? `${u.firstName} ${u.lastName}` : null);
  }, []);

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

      if (e.key === "ArrowDown" && (!isEditable || isSearch)) {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(filteredCodes.length - 1, 0)));
      } else if (e.key === "ArrowUp" && (!isEditable || isSearch)) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && (!isEditable || isSearch)) {
        const chosen = filteredCodes[selectedIndex];
        if (chosen) {
          e.preventDefault();
          navigate(`/isci/${chosen.code}`);
        }
      } else if (!isEditable && (e.key === "e" || e.key === "E")) {
        const chosen = filteredCodes[selectedIndex];
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
  }, [filteredCodes, selectedIndex, navigate]);

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
        {!isLoading && canEdit() && (
          <div className={styles.pgActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate("/create")}
            >
              + New ISCI Code
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

          <div className={styles.density} role="group" aria-label="Row density">
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
        </div>
      )}

      <div className={styles.scrollableContent}>
        {isLoading ? (
          <div className={styles.loadingState}>Loading…</div>
        ) : (
          <ISCIList
            codes={filteredCodes}
            onDelete={handleDeleteCode}
            density={density}
            selectedIndex={selectedIndex}
          />
        )}
      </div>

      {!isLoading && (
        <footer className={styles.footer}>
          <div>
            {filteredCodes.length} {filteredCodes.length === 1 ? "row" : "rows"}
            {selectedIndex >= 0 ? " · 1 selected" : ""}
          </div>
          <div className={styles.footerShortcuts}>
            <kbd>↑↓</kbd> navigate
            <kbd>⏎</kbd> view
            {canEdit() && (<><kbd>E</kbd> edit <kbd>N</kbd> new</>)}
            <kbd>⌘K</kbd> palette
          </div>
        </footer>
      )}
      </main>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Dashboard;
