import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { getUserSession, isAdmin } from "@/utils/auth";
import ProfileMenu from "@/components/ProfileMenu";
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";
import DefaultProfileImage from "./assets/default_profile_image.jpg";

const Header = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Only run on client side after hydration
    setUser(getUserSession());
  }, []);

  // Determine if a path is active
  const isActive = (path) => {
    if (path === "/") {
      // Dashboard is active only on root path
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Handle click on active nav items
  const handleNavClick = (e, path) => {
    if (isActive(path)) {
      e.preventDefault();
    }
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const displayRole = user ? (user.userType === "admin" ? "Admin" : "Editor") : "Guest";
  const profileImage = user?.profileImage || DefaultProfileImage;

  return(
    <header className={styles.header}>

      <div className={styles.title}>
        <Logo className={styles.logo} aria-hidden="true" focusable="false" />
        <h1>ISCIz <span>alpha</span></h1>
      </div>

      <div className={styles.headerActions}>
        <a
          href="/"
          className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          onClick={(e) => handleNavClick(e, "/")}
        >
          Dashboard
        </a>

        {isAdmin() && (
          <>
            <a
              href="/reports"
              className={`${styles.navLink} ${isActive("/reports") ? styles.active : ""}`}
              onClick={(e) => handleNavClick(e, "/reports")}
            >
              Reports
            </a>

            <a
              href="/admin"
              className={`${styles.navLink} ${isActive("/admin") ? styles.active : ""}`}
              onClick={(e) => handleNavClick(e, "/admin")}
            >
              Admin
            </a>
          </>
        )}
      </div>

      <div className={styles.profile}>
        <div className={styles.name}>
          <p>{displayName}</p>
          <p>{displayRole}</p>
        </div>
        <img src={profileImage} alt="Profile" />
        <ProfileMenu />
      </div>
    </header>
  )
}




export default Header;