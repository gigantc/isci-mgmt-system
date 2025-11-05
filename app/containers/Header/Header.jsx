
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";
import ProfileTemp from "./assets/profile.jpg";

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

        <a href="/admin" className="btn-text">
         Assets
        </a>

        <a href="/admin" className="btn-text">
          Exports
        </a>

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
            + New ISCI Code
          </button>
        )}

      </div>

      <div className={styles.profile}>
        <div className={styles.name}>
          <p>Steve McVideo</p>
          <p>Superadmin</p>
        </div>
        <img src={ProfileTemp} />
      </div>
    </header>
  )
}




export default Header;