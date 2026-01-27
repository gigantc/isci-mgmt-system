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

  // Render page
  return (
    <div className={styles.createISCI}>

      <div className={styles.pageContent}>
        {/* Sticky header section */}
        <div className={styles.stickyHeader}>
          <div className={styles.headerContent}>
            <h2>Create New ISCI Code</h2>
            {!isLoading && (
              <div className={styles.headerActions}>
                <button type="button" className="btn-text" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleSubmitClick}>
                  Create ISCI
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content area */}
        <div className={styles.scrollableContent}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading...</div>
          ) : (
            <ISCIForm
              code={null}
              onSubmit={handleCreateCode}
              onCancel={handleCancel}
              allCodes={codes}
              hideActions={true}
              hideTitle={true}
              formRef={formRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateISCI;
