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
        {/* Sticky header section */}
        <div className={styles.stickyHeader}>
          <div className={styles.headerContent}>
            <h2>{userIsAdmin ? "Edit ISCI Code" : "View ISCI Code"}</h2>
            {!isLoading && !error && (
              <div className={styles.headerActions}>
                <button type="button" className="btn-text" onClick={handleCancel}>
                  {userIsAdmin ? "Cancel" : "Back"}
                </button>
                {userIsAdmin && (
                  <button type="button" className="btn-primary" onClick={handleSubmitClick}>
                    Update ISCI
                  </button>
                )}
              </div>
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
            <>
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
              <div className={styles.slateHistoryRow}>
                <Slate code={code} />
                <div className={styles.auditSection}>
                  <h3>History</h3>
                  <div className={styles.auditGrid}>
                    <div className={styles.auditItem}>
                      <span className={styles.auditLabel}>Created By:</span>
                      <span className={styles.auditValue}>{code.createdBy || "Unknown"}</span>
                    </div>
                    <div className={styles.auditItem}>
                      <span className={styles.auditLabel}>Date Created:</span>
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditISCI;
