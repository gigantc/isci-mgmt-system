import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import Slate from "@/components/Slate";
import { isAuthenticated, getUserSession, saveUserSession, isAdmin, canEdit } from "@/utils/auth";
import { formatAirDateDot } from "@/utils/dates";
import styles from "./Detail.module.scss";

/**
 * Detail Container
 *
 * Read-only view of an ISCI code at /isci/:code.
 * Admin users see an "Edit" button that routes to /edit/:code.
 * Non-admin users already get read-only EditISCI, so this path is primarily
 * used as the default row-click target from the dashboard.
 */
const Detail = () => {
  const navigate = useNavigate();
  const { code: isciCode } = useParams();
  const userIsAdmin = isAdmin();
  const userCanEdit = canEdit();

  const [code, setCode] = useState(null);
  const [allCodes, setAllCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = formatAirDateDot;

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getEditHistory = () => {
    if (!code || !code.editHistory) return [];
    if (Array.isArray(code.editHistory)) return code.editHistory;
    try {
      const parsed = JSON.parse(code.editHistory);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [isciCode]);

  useEffect(() => {
    if (code && isciCode) {
      const trackView = async () => {
        const user = getUserSession();
        if (user) {
          try {
            const response = await fetch("/api/user/recently-viewed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id, isciCode }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.recentlyViewed) {
                const updatedUser = { ...user, recentlyViewed: data.recentlyViewed };
                saveUserSession(updatedUser);
              }
            }
          } catch (err) {
            console.error("Error tracking recently viewed:", err);
          }
        }
      };
      trackView();
    }
  }, [code, isciCode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/isci");
      if (!response.ok) throw new Error("Failed to load ISCI codes");
      const data = await response.json();
      setAllCodes(data);
      const found = data.find((c) => c.code === isciCode);
      if (!found) {
        setError(`ISCI code "${isciCode}" not found`);
        return;
      }
      setCode(found);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.pageContent}>
        <div className={styles.scrollableContent}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading ISCI code...</div>
          ) : error ? (
            <div className={styles.errorState}>
              <h3>Error</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={() => navigate("/")}>
                Back to Dashboard
              </button>
            </div>
          ) : (
            <div className={styles.editGrid}>
              <div className={styles.formColumn}>
                <div className={styles.pageHeader}>
                  <div className={styles.pageHeaderMain}>
                    <div className={styles.crumbs}>
                      <button type="button" onClick={() => navigate("/")}>← Dashboard</button>
                      <span className={styles.sep}>/</span>
                      <span>{isciCode}</span>
                    </div>
                    <h1 className={styles.title}>
                      <span className={styles.titleLabel}>ISCI</span>
                      <span className={styles.titleCode}>{isciCode}</span>
                      <span className={styles.readOnlyBadge}>Read only</span>
                    </h1>
                    {code && (
                      <p className={styles.subtitle}>
                        {code.brand}
                        {code.campaignName ? ` · ${code.campaignName}` : ""}
                        {code.createdAt ? ` · Created ${formatDate(code.createdAt)}` : ""}
                        {code.createdBy ? ` by ${code.createdBy}` : ""}
                      </p>
                    )}
                  </div>
                  <div className={styles.pageHeaderActions}>
                    <button
                      type="button"
                      className={styles.headerBtn}
                      onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(code.code); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy code
                    </button>
                    <button
                      type="button"
                      className={styles.headerBtn}
                      onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                      </svg>
                      Share
                    </button>
                    {userCanEdit && (
                      <button
                        type="button"
                        className={`${styles.headerBtn} ${styles.headerBtnPrimary}`}
                        onClick={() => navigate(`/edit/${isciCode}`)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <ISCIForm
                  code={code}
                  onSubmit={() => {}}
                  onCancel={() => navigate("/")}
                  allCodes={allCodes}
                  hideActions={true}
                  hideTitle={true}
                  viewOnly={true}
                />

                {/* 05 — Activity */}
                <div className={styles.activitySection}>
                  <h3 className={styles.activityTitle}>
                    <span className={styles.activityNumber}>05</span> Activity
                  </h3>
                  <div className={styles.activityFeed}>
                    <div className={styles.activityRow}>
                      <span className={`${styles.activityDot} ${styles.activityDotNew}`} aria-hidden="true" />
                      <div className={styles.activityBody}>
                        <div className={styles.activityHead}>
                          <strong>{code.createdBy || "Unknown"}</strong>
                          <span className={styles.activityMeta}>
                            · {formatDate(code.createdAt)} · {formatTime(code.createdAt)}
                          </span>
                        </div>
                        <div className={styles.activityText}>Created ISCI {code.code}</div>
                      </div>
                    </div>

                    {getEditHistory()
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                        <div key={`${entry.timestamp}-${index}`} className={styles.activityRow}>
                          <span className={styles.activityDot} aria-hidden="true" />
                          <div className={styles.activityBody}>
                            <div className={styles.activityHead}>
                              <strong>{entry.user || "Unknown"}</strong>
                              <span className={styles.activityMeta}>
                                · {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                              </span>
                            </div>
                            <div className={styles.activityText}>
                              {entry.description || "Edited record"}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <aside className={styles.aside}>
                <Slate code={code} />
                <div className={styles.quickActions}>
                  <div className={styles.quickActionsLabel}>Quick Actions</div>
                  <button
                    type="button"
                    className={styles.qaButton}
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(code.code);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy ISCI code
                  </button>
                  {userCanEdit && (
                    <button
                      type="button"
                      className={styles.qaButton}
                      onClick={() => navigate(`/create?from=${encodeURIComponent(code.code)}`)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Duplicate as new cutdown
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.qaButton}
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                    </svg>
                    Copy share link
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Detail;
