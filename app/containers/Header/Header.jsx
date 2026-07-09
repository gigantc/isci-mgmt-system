import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import { getUserSession } from "@/utils/auth";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "@/assets/Logo.svg";
import DefaultProfileImage from "@/assets/default_profile_image.jpg";

const Header = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setUser(getUserSession());
  }, []);

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

  const displayRole = useMemo(() => {
    if (!user) return "Guest";
    if (user.userType === "admin") return "Admin";
    if (user.userType === "viewer") return "Viewer";
    return "Editor";
  }, [user]);

  const profileImage = useMemo(() =>
    user?.profileImage || DefaultProfileImage,
    [user?.profileImage]
  );

  return(
    <header className={styles.header}>

      <div className={styles.title}>
        <Logo className={styles.logo} aria-hidden="true" focusable="false" />
        <h1>ISCIz <span>beta</span></h1>
      </div>

      <div className={styles.headerActions}>
        <Link
          to="/"
          className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          onClick={(e) => handleNavClick(e, "/")}
        >
          Dashboard
        </Link>

        {user?.userType !== "viewer" && (
          <Link
            to="/reports"
            className={`${styles.navLink} ${isActive("/reports") ? styles.active : ""}`}
            onClick={(e) => handleNavClick(e, "/reports")}
          >
            Reports
          </Link>
        )}

        {user?.userType === "admin" && (
          <Link
            to="/admin"
            className={`${styles.navLink} ${isActive("/admin") ? styles.active : ""}`}
            onClick={(e) => handleNavClick(e, "/admin")}
          >
            Admin
          </Link>
        )}
      </div>

      <div className={styles.profile}>
        <ThemeToggle />
        <div className={styles.name}>
          <p>{displayName}</p>
          <p>{displayRole}</p>
        </div>
        <ProfileMenu profileImage={profileImage} />
      </div>
    </header>
  )
}




export default Header;