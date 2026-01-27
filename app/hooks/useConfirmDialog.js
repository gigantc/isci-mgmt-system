import { useState, useCallback } from "react";

/**
 * useConfirmDialog Hook
 *
 * Manages state for the ConfirmDialog component
 * Provides a Promise-based API for showing confirmation dialogs
 *
 * @returns {object} Dialog state and methods
 *
 * @example
 * const { dialogProps, confirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Delete Item",
 *     message: "Are you sure you want to delete this item?",
 *   });
 *   if (confirmed) {
 *     // Delete the item
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog {...dialogProps} />
 *   </>
 * );
 */
const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDangerous: true,
    resolve: null,
  });

  /**
   * Show confirmation dialog and return a Promise
   */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || "Confirm Action",
        message: options.message || "Are you sure?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        isDangerous: options.isDangerous !== undefined ? options.isDangerous : true,
        resolve,
      });
    });
  }, []);

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState.resolve]);

  /**
   * Props to spread onto ConfirmDialog component
   */
  const dialogProps = {
    isOpen: dialogState.isOpen,
    title: dialogState.title,
    message: dialogState.message,
    confirmText: dialogState.confirmText,
    cancelText: dialogState.cancelText,
    isDangerous: dialogState.isDangerous,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return {
    dialogProps,
    confirm,
  };
};

export default useConfirmDialog;
