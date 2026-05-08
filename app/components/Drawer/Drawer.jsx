import { useEffect } from "react";
import styles from "./Drawer.module.scss";

/**
 * Right-side slide-in Drawer used by Admin Clients / Agencies / Users.
 *
 * Props:
 *   open        — controls visibility (renders nothing when false).
 *   onClose     — called when the scrim is clicked or Escape is pressed.
 *   title       — header title text.
 *   subtitle    — optional monospace subtitle rendered under the title.
 *   footer      — ReactNode rendered in the drawer footer (typically action buttons).
 *   children    — main body content.
 */
const Drawer = ({ open, onClose, title, subtitle, footer, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={title}>
        <header className={styles.header}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </>
  );
};

export default Drawer;
