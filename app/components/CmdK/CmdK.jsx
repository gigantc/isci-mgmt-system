import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { rankByFuzzy } from "@/utils/fuzzy";
import { isAuthenticated, isAdmin, canEdit } from "@/utils/auth";
import styles from "./CmdK.module.scss";

const RECENT_KEY = "isciz-recent-searches";
const MAX_RECENT = 6;

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CmdK = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [codes, setCodes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Global shortcut
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Load data when opening
  useEffect(() => {
    if (!open) return;
    if (!isAuthenticated()) {
      setOpen(false);
      return;
    }
    setQuery("");
    setActiveIndex(0);
    fetch("/api/isci")
      .then((r) => (r.ok ? r.json() : []))
      .then((c) => setCodes(Array.isArray(c) ? c : []))
      .catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const saveRecent = (term) => {
    if (!term || !term.trim()) return;
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      const prev = stored ? JSON.parse(stored) : [];
      const next = [term, ...prev.filter((r) => r !== term)].slice(0, MAX_RECENT);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const close = () => setOpen(false);

  const userIsAdmin = isAdmin();
  const userCanEdit = canEdit();

  const actions = useMemo(() => {
    const all = [
      { id: "dashboard", label: "Dashboard", sub: "Back to all codes", icon: <ListIcon />, run: () => navigate("/") },
      { id: "new", label: "New ISCI code", sub: "Create a new record", icon: <PlusIcon />, run: () => navigate("/create"), show: userCanEdit },
      { id: "admin", label: "Admin", sub: "Clients, agencies, users", icon: <UsersIcon />, run: () => navigate("/admin"), show: userIsAdmin },
      { id: "reports", label: "Reports", sub: "Import & export data", icon: <ListIcon />, run: () => navigate("/reports"), show: userCanEdit },
    ].filter((a) => a.show !== false);
    if (!query.trim()) return all;
    return all.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
  }, [query, navigate, userIsAdmin, userCanEdit]);

  const matches = useMemo(() => {
    if (!query.trim()) return codes.slice(0, 6);
    return rankByFuzzy(codes, query, ["code", "brand", "campaignName", "spotTitle"]).slice(0, 8);
  }, [codes, query]);

  const flat = useMemo(
    () => [
      ...actions.map((a) => ({ t: "a", item: a })),
      ...matches.map((r) => ({ t: "r", item: r })),
    ],
    [actions, matches]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runAt = (idx) => {
    const entry = flat[idx];
    if (!entry) return;
    saveRecent(query);
    close();
    if (entry.t === "a") {
      entry.item.run();
    } else {
      navigate(`/isci/${entry.item.code}`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(activeIndex);
    }
  };

  if (!open) return null;

  const headingLabel = query.trim() ? "Matching codes" : "Recent";

  return (
    <div className={styles.scrim} onClick={close}>
      <div
        className={styles.pal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className={styles.pi}>
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search codes or run a command…"
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>

        <div className={styles.pres}>
          {actions.length > 0 && (
            <>
              <div className={styles.grp}>Actions</div>
              {actions.map((a, i) => {
                const ii = i;
                return (
                  <button
                    type="button"
                    key={a.id}
                    className={`${styles.rr} ${activeIndex === ii ? styles.rrOn : ""}`}
                    onMouseEnter={() => setActiveIndex(ii)}
                    onClick={() => runAt(ii)}
                  >
                    <span className={styles.rrIcon}>{a.icon}</span>
                    <span className={styles.tt}>{a.label}</span>
                    <span className={styles.sub}>{a.sub}</span>
                  </button>
                );
              })}
            </>
          )}

          {matches.length > 0 && (
            <>
              <div className={styles.grp}>{headingLabel}</div>
              {matches.map((r, i) => {
                const ii = actions.length + i;
                return (
                  <button
                    type="button"
                    key={r.id}
                    className={`${styles.rr} ${activeIndex === ii ? styles.rrOn : ""}`}
                    onMouseEnter={() => setActiveIndex(ii)}
                    onClick={() => runAt(ii)}
                  >
                    <span className={styles.co}>{r.code}</span>
                    <span className={styles.tt}>{r.spotTitle}</span>
                    <span className={styles.sub}>
                      {r.brand}
                      {r.spotLength ? ` · ${r.spotLength}s` : ""}
                      {r.channel ? ` · ${r.channel}` : ""}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {actions.length === 0 && matches.length === 0 && (
            <div className={styles.empty}>No matches for “{query}”</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CmdK;
