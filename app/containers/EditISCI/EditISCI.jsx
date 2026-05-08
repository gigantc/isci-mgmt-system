import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import Slate from "@/components/Slate";
import { isAuthenticated, getUserSession, saveUserSession, isAdmin } from "@/utils/auth";
import styles from "./EditISCI.module.scss";

/**
 * EditISCI Container
 *
 * Dedicated container for editing/viewing an existing ISCI code.
 * Shows read-only view for non-admins and edit mode for admins.
 * This component is decoupled from the Dashboard so it can be accessed
 * from multiple places in the application.
 */
const EditISCI = () => {
  const navigate = useNavigate();
  const { code: isciCode } = useParams();
  const formRef = useRef(null);
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

  /**
   * Track this ISCI code as recently viewed
   */
  useEffect(() => {
    if (code && isciCode) {
      const trackView = async () => {
        const user = getUserSession();
        if (user) {
          try {
            const response = await fetch("/api/user/recently-viewed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                isciCode: isciCode
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.recentlyViewed) {
                // Update the user session with the new recentlyViewed array
                const updatedUser = { ...user, recentlyViewed: data.recentlyViewed };
                saveUserSession(updatedUser);
              }
            }
          } catch (error) {
            console.error("Error tracking recently viewed:", error);
            // Don't block the UI if tracking fails
          }
        }
      };
      trackView();
    }
  }, [code, isciCode]);

  /**
   * Load both the specific code being edited and all codes
   * (needed for the form's validation/auto-generation)
   */
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all ISCI codes
      const response = await fetch("/api/isci");
      if (!response.ok) throw new Error("Failed to load ISCI codes");

      const data = await response.json();
      setAllCodes(data);

      // Find the specific code to edit by ISCI code
      const codeToEdit = data.find(c => c.code === isciCode);
      if (!codeToEdit) {
        setError(`ISCI code "${isciCode}" not found`);
        return;
      }

      setCode(codeToEdit);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save the updated code to the server
   */
  const handleUpdateCode = async (formData) => {
    if (!code) return;

    const user = getUserSession();
    const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "";

    const updatedCode = {
      ...code,
      ...formData,
      updatedBy: userDisplayName || null,
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/isci", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCode),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success! Navigate back to dashboard
        navigate("/");
      } else {
        console.error("Failed to save ISCI code:", result.error);
        // TODO: Show error message to user
      }
    } catch (err) {
      console.error("Error saving ISCI code:", err);
      // TODO: Show error toast notification
    }
  };

  /**
   * Cancel editing and return to dashboard
   */
  const handleCancel = () => {
    navigate("/");
  };

  /**
   * Trigger form submission from header button
   */
  const handleSubmitClick = () => {
    if (formRef.current) {
      if (typeof formRef.current.requestSubmit === "function") {
        formRef.current.requestSubmit();
      } else {
        formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }
  };

  // Render page
  return (
    <div className={styles.editISCI}>

      <div className={styles.pageContent}>
        <div className={styles.stickyHeader}>
          <div className={styles.headerContent}>
            <div className={styles.crumbs}>
              <button type="button" onClick={() => navigate("/")}>Dashboard</button>
              <span className={styles.sep}>/</span>
              <button type="button" onClick={() => navigate(`/isci/${isciCode}`)}>
                {code?.brand || "ISCI"}
              </button>
              <span className={styles.sep}>/</span>
              <span>{isciCode}</span>
              <span className={styles.sep}>/</span>
              <span>{userIsAdmin ? "Edit" : "View"}</span>
            </div>
            <h1 className={styles.title}>
              <span className={styles.titleCode}>{isciCode}</span>
              {code?.spotTitle && <span>{code.spotTitle}</span>}
              <span className={`${styles.titleBadge} ${userIsAdmin ? styles.titleBadgeEdit : ""}`}>
                {userIsAdmin ? "Editing" : "Read-only"}
              </span>
            </h1>
            {code && (
              <p className={styles.subtitle}>
                {code.brand}
                {code.campaignName ? ` · ${code.campaignName}` : ""}
                {code.spotLength ? ` · ${code.spotLength}s` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
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
                  onSubmit={handleUpdateCode}
                  onCancel={handleCancel}
                  allCodes={allCodes}
                  hideActions={true}
                  hideTitle={true}
                  formRef={formRef}
                  viewOnly={!userIsAdmin}
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

        {!isLoading && !error && (
          <footer className={styles.footer}>
            <div className={styles.footerStatus}>
              <span className={styles.footerDot} aria-hidden="true" />
              All changes saved
              {code?.updatedAt && <> · {formatTime(code.updatedAt)}</>}
            </div>
            <div className={styles.footerActions}>
              <button type="button" className={styles.footerBtn} onClick={handleCancel}>
                {userIsAdmin ? "Cancel" : "Back"}
              </button>
              {userIsAdmin && (
                <button type="button" className={`${styles.footerBtn} ${styles.footerBtnPrimary}`} onClick={handleSubmitClick}>
                  Update ISCI
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default EditISCI;
