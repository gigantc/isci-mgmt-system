import { useEffect } from "react";
import styles from "./Modal.module.scss";

/**
 * Modal Component
 *
 * Centered dialog surface over a lighter, blurred scrim. Shared by
 * ConfirmDialog and the About dialog. Closes on Escape and on scrim click.
 *
 * Props:
 *   open      - controls visibility (renders nothing when false).
 *   onClose   - called on Escape or when the scrim is clicked.
 *   label     - accessible name for the dialog.
 *   children  - dialog content.
 */
const Modal = ({ open, onClose, label, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    // Prevent body scroll while the modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
