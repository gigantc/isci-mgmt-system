import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import Slate from "@/components/Slate";
import { isAuthenticated, getUserSession, saveUserSession, isAdmin } from "@/utils/auth";
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

  const [code, setCode] = useState(null);
  const [allCodes, setAllCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}.${day}.${year}`;
  };

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
        <div className={styles.stickyHeader}>
          <div className={styles.headerContent}>
            <div className={styles.crumbs}>
              <button type="button" onClick={() => navigate("/")}>Dashboard</button>
              <span className={styles.sep}>/</span>
              <span>{code?.brand || "ISCI"}</span>
              <span className={styles.sep}>/</span>
              <span>{isciCode}</span>
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleCode}>{isciCode}</span>
              {code?.spotTitle && <span>{code.spotTitle}</span>}
              <span className={styles.titleBadge}>Read-only</span>
            </h1>
            {code && (
              <p className={styles.subtitle}>
                {code.brand}
                {code.campaignName ? ` · ${code.campaignName}` : ""}
                {code.spotLength ? ` · ${code.spotLength}s` : ""}
              </p>
            )}
          </div>
          {!isLoading && !error && (
            <div className={styles.headerActions}>
              <button type="button" className="btn-text" onClick={() => navigate("/")}>
                Back
              </button>
              {userIsAdmin && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate(`/edit/${isciCode}`)}
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

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
                <ISCIForm
                  code={code}
                  onSubmit={() => {}}
                  onCancel={() => navigate("/")}
                  allCodes={allCodes}
                  hideActions={true}
                  hideTitle={true}
                  viewOnly={true}
                />
              </div>
              <aside className={styles.aside}>
                <Slate code={code} />
                <div className={styles.auditSection}>
                  <h3>History</h3>
                  <div className={styles.auditGrid}>
                    <div className={styles.auditItem}>
                      <span className={styles.auditLabel}>Created By</span>
                      <span className={styles.auditValue}>{code.createdBy || "Unknown"}</span>
                    </div>
                    <div className={styles.auditItem}>
                      <span className={styles.auditLabel}>Created</span>
                      <span className={styles.auditValue}>{formatDate(code.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.auditHistory}>
                    {getEditHistory().length > 0 ? (
                      getEditHistory()
                        .slice()
                        .reverse()
                        .map((entry, index) => (
                          <p key={`${entry.timestamp}-${index}`} className={styles.auditEntry}>
                            edited by {entry.user || "Unknown"} on {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                          </p>
                        ))
                    ) : (
                      <p className={styles.auditEmpty}>No edits yet</p>
                    )}
                  </div>
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
