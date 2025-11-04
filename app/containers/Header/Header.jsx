
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";

const Header = ({
  isLoading,
  setShowForm,
  showAdminButton = true,
  showCreateButton = true,
  showBackButton = false
}) => {
  return(
    <header className={styles.header}>
      <div className={styles.title}>
        <Logo className={styles.logo} aria-hidden="true" focusable="false" />
        <h1>ISCIz <span>alpha</span></h1>
      </div>

      <div className={styles.headerActions}>
        {showBackButton && (
          <a href="/" className="btn-text">
           Dashboard
          </a>
        )}

        {showAdminButton && (
          <a href="/admin" className="btn-text">
            Admin
          </a>
        )}

        {showCreateButton && (
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
            }}
            disabled={isLoading}
          >
            New ISCI Code
          </button>
        )}
      </div>
    </header>
  )
}




export default Header;