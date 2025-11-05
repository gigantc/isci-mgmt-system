
import { useNavigate } from "react-router";
import { getUserSession, clearUserSession } from "@/utils/auth";
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";
import ProfileTemp from "./assets/profile.jpg";

const Header = ({
  showAdminButton = true,
  showCreateButton = true,
  showBackButton = false
}) => {
  const navigate = useNavigate();
  const user = getUserSession();
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const displayRole = user ? (user.userType === "admin" ? "Admin" : "Editor") : "Guest";

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

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
          <a href="/create" className="btn-primary">
            + New ISCI Code
          </a>
        )}

      </div>

      <div className={styles.profile}>
        <div className={styles.name}>
          <p>{displayName}</p>
          <p>{displayRole}</p>
        </div>
        <img src={ProfileTemp} alt="Profile" />
        <button
          onClick={handleLogout}
          className={styles.logoutButton}
          title="Logout"
        >
          Logout
        </button>
      </div>
    </header>
  )
}




export default Header;