import Modal from "@/components/Modal";
import styles from "./ConfirmDialog.module.scss";

/**
 * ConfirmDialog Component
 *
 * A custom styled confirmation dialog that replaces browser's confirm().
 * The surface, scrim and Escape/scrim-click handling come from Modal.
 */
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", isDangerous = true }) => (
  <Modal open={isOpen} onClose={onCancel} label={title}>
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
  </Modal>
);

export default ConfirmDialog;
