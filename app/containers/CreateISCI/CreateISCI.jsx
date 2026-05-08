import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import ISCIForm from "@/components/ISCIForm";
import { getUserSession, isAuthenticated } from "@/utils/auth";
import { generateUUID } from "@/utils/uuid";
import styles from "./CreateISCI.module.scss";

/**
 * CreateISCI Container
 *
 * Dedicated container for creating a new ISCI code.
 * This component is decoupled from the Dashboard.
 */
const CreateISCI = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [codes, setCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    loadCodes();
  }, []);

  /**
   * Load all ISCI codes (needed for auto-generation)
   */
  const loadCodes = async () => {
    try {
      const response = await fetch("/api/isci");
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      }
    } catch (error) {
      console.error("Error loading ISCI codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save the new code to the server
   */
  const handleCreateCode = async (formData) => {
    const user = getUserSession();
    const userDisplayName = user ? `${user.firstName} ${user.lastName}` : "";

    const newCode = {
      id: generateUUID(),
      ...formData,
      createdBy: userDisplayName || null,
      updatedBy: userDisplayName || null,
      editHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/isci", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCode),
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
   * Cancel creating and return to dashboard
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

  return (
    <div className={styles.createISCI}>
      <div className={styles.pageContent}>
        <div className={styles.stickyHeader}>
          <div className={styles.headerContent}>
            <div className={styles.crumbs}>
              <button type="button" onClick={() => navigate("/")}>Dashboard</button>
              <span className={styles.sep}>/</span>
              <span>New ISCI Code</span>
            </div>
            <h1 className={styles.title}>
              Create ISCI Code
              <span className={`${styles.titleBadge} ${styles.titleBadgeNew}`}>New</span>
            </h1>
            <p className={styles.subtitle}>Select a client to auto-generate the code.</p>
          </div>
        </div>

        <div className={styles.scrollableContent}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading…</div>
          ) : (
            <div className={styles.editGrid}>
              <div className={styles.formColumn}>
                <ISCIForm
                  code={null}
                  onSubmit={handleCreateCode}
                  onCancel={handleCancel}
                  allCodes={codes}
                  hideActions={true}
                  hideTitle={true}
                  formRef={formRef}
                />
              </div>
              <aside className={styles.aside}>
                <div className={styles.slatePlaceholder}>
                  <div className={styles.slateLabel}>Slate Preview</div>
                  <div className={styles.slateBody}>
                    <div className={styles.slateHint}>
                      The slate becomes available once the ISCI is saved.
                    </div>
                  </div>
                </div>

                <div className={styles.tipCard}>
                  <div className={styles.tipLabel}>Tips</div>
                  <ul className={styles.tipList}>
                    <li>Select a <strong>Client</strong> to auto-generate the code.</li>
                    <li><strong>Spot Title</strong> is required.</li>
                    <li>Leave the <strong>Air / Start Date</strong> blank and check TBD if unknown.</li>
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </div>

        {!isLoading && (
          <footer className={styles.footer}>
            <div className={styles.footerStatus}>
              <span className={styles.footerDot} aria-hidden="true" />
              Draft · not saved
            </div>
            <div className={styles.footerActions}>
              <button type="button" className={styles.footerBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.footerBtn} ${styles.footerBtnPrimary}`}
                onClick={handleSubmitClick}
              >
                Create ISCI
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default CreateISCI;
