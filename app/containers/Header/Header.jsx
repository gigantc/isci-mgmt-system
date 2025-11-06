import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import { getUserSession, isAdmin } from "@/utils/auth";
import ProfileMenu from "@/components/ProfileMenu";
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";
import DefaultProfileImage from "./assets/default_profile_image.jpg";

const Header = () => {
  // Initialize user immediately to prevent flash
  const [user, setUser] = useState(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });
  const location = useLocation();

  // Only check for user updates when navigating to profile page
  // This prevents unnecessary re-renders on every route change
  useEffect(() => {
    if (location.pathname === "/profile") {
      const currentUser = getUserSession();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser);
      }
    }
  }, [location.pathname, user]);

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

  // Memoize computed values to prevent unnecessary recalculations
  const displayName = useMemo(() =>
    user ? `${user.firstName} ${user.lastName}` : "Guest",
    [user]
  );

  const displayRole = useMemo(() =>
    user ? (user.userType === "admin" ? "Admin" : "Editor") : "Guest",
    [user]
  );

  const profileImage = useMemo(() =>
    user?.profileImage || DefaultProfileImage,
    [user?.profileImage]
  );

  return(
    <header className={styles.header}>

      <div className={styles.title}>
        <Logo className={styles.logo} aria-hidden="true" focusable="false" />
        <h1>ISCIz <span>alpha</span></h1>
      </div>

      <div className={styles.headerActions}>
        <Link
          to="/"
          className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          onClick={(e) => handleNavClick(e, "/")}
        >
          Dashboard
        </Link>

        {isAdmin() && (
          <>
            <Link
              to="/reports"
              className={`${styles.navLink} ${isActive("/reports") ? styles.active : ""}`}
              onClick={(e) => handleNavClick(e, "/reports")}
            >
              Reports
            </Link>

            <Link
              to="/admin"
              className={`${styles.navLink} ${isActive("/admin") ? styles.active : ""}`}
              onClick={(e) => handleNavClick(e, "/admin")}
            >
              Admin
            </Link>
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