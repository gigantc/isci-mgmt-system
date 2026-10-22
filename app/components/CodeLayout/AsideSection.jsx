import styles from "./CodeLayout.module.scss";

/**
 * Labeled block in the CodeLayout aside. It sits directly on the page frame,
 * like a dashboard sidebar group; `action` renders at the right of the label.
 */
const AsideSection = ({ label, action, children }) => (
  <section className={styles.asideSection}>
    <div className={styles.asideHead}>
      <h2 className={styles.asideLabel}>{label}</h2>
      {action}
    </div>
    {children}
  </section>
);

export default AsideSection;
