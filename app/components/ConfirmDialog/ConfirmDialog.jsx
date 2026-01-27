import { useEffect } from "react";
import styles from "./ConfirmDialog.module.scss";

/**
 * ConfirmDialog Component
 *
 * A custom styled confirmation dialog that replaces browser's confirm()
 * Matches the app's dark mode theme
 */
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", isDangerous = true }) => {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
        </div>

        <div className={styles.body}>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className="btn-text"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDangerous ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
