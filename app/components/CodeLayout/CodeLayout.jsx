import { useNavigate } from "react-router";
import styles from "./CodeLayout.module.scss";

const BADGE_TONES = {
  ok: styles.badgeOk,
  accent: styles.badgeAccent,
  neutral: styles.badgeNeutral,
};

const DOT_TONES = {
  saved: styles.dotSaved,
  draft: styles.dotDraft,
};

/**
 * CodeLayout
 *
 * Shared page shell for the code screens (create, edit, view): header on the
 * frame, a form column plus aside, and a floating footer bar. Pages pass the
 * form as children and keep only their own data loading and handlers.
 *
 * Props:
 *   crumbs         [{ label, to? }]; entries with `to` render as links.
 *   title          node; wrap an ISCI code in <code> for the mono accent style.
 *   badge          { label, tone: "ok" | "accent" | "neutral" }.
 *   subtitle       node.
 *   headerActions  node rendered at the right of the header.
 *   aside          node rendered in the right column; when omitted the track stays
 *                  empty so the form keeps the same width as the code pages.
 *   footerStatus   { tone: "saved" | "draft", text }.
 *   footerActions  node rendered at the right of the footer bar.
 *   loading        boolean; shows loadingText instead of the form.
 *   error          string; shows an error state instead of the form.
 */
const CodeLayout = ({
  crumbs = [],
  title,
  badge,
  subtitle,
  headerActions,
  aside,
  footerStatus,
  footerActions,
  loading = false,
  loadingText = "Loading…",
  error = null,
  children,
}) => {
  const navigate = useNavigate();
  const ready = !loading && !error;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headMain}>
          {crumbs.length > 0 && (
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              {crumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`}>
                  {i > 0 && <span className={styles.sep} aria-hidden="true">/</span>}
                  {crumb.to ? (
                    <button type="button" onClick={() => navigate(crumb.to)}>
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className={styles.title}>
            {title}
            {badge && (
              <span className={`${styles.badge} ${BADGE_TONES[badge.tone] || styles.badgeNeutral}`}>
                {badge.label}
              </span>
            )}
          </h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {headerActions && <div className={styles.headActions}>{headerActions}</div>}
      </header>

      <div className={styles.scroll}>
        {loading && <div className={styles.state}>{loadingText}</div>}
        {error && (
          <div className={styles.state}>
            <h3>Error</h3>
            <p>{error}</p>
            <button type="button" className="btn-primary" onClick={() => navigate("/")}>
              Back to Dashboard
            </button>
          </div>
        )}
        {ready && (
          <div className={styles.grid}>
            <div className={styles.main}>{children}</div>
            {aside && <aside className={styles.aside}>{aside}</aside>}
          </div>
        )}
      </div>

      {ready && (footerStatus || footerActions) && (
        <footer className={styles.footer}>
          {footerStatus && (
            <div className={styles.footerStatus}>
              <span
                className={`${styles.dot} ${DOT_TONES[footerStatus.tone] || styles.dotSaved}`}
                aria-hidden="true"
              />
              {footerStatus.text}
            </div>
          )}
          {footerActions && <div className={styles.footerActions}>{footerActions}</div>}
        </footer>
      )}
    </div>
  );
};

export default CodeLayout;
