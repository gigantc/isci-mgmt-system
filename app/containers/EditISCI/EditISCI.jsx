import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { ISCIStatus } from "@/types/isci";
import ISCIForm from "@/components/ISCIForm";
import Header from "@/containers/Header";
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

    const updatedCode = {
      ...code,
      ...formData,
      updatedAt: new Date().toISOString(),
      completedAt: formData.status === ISCIStatus.COMPLETED
        ? new Date().toISOString()
        : code.completedAt,
    };

    // Replace the old code with updated one in the array
    const updatedCodes = allCodes.map(c =>
      c.id === code.id ? updatedCode : c
    );

    try {
      const response = await fetch("/api/isci", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCodes),
      });

      if (response.ok) {
        // Success! Navigate back to dashboard
        navigate("/");
      } else {
        console.error("Failed to save ISCI code");
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
      formRef.current.requestSubmit();
    }
  };

  // Render page
  return (
    <div className={styles.editISCI}>
      <Header />

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
          )}
        </div>
      </div>
    </div>
  );
};

export default EditISCI;
