import { useMemo } from "react";
import { useLocation, Link } from "react-router";
import { useSession } from "@/hooks";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./Header.module.scss";
import AppLogo from "@/components/AppLogo";
import DefaultProfileImage from "@/assets/default_profile_image.jpg";

const Header = () => {
  const { user, ready, isAdmin, isViewer, roleLabel } = useSession();
  const location = useLocation();

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

  const profileImage = useMemo(() =>
    user?.profileImage || DefaultProfileImage,
    [user?.profileImage]
  );

  return(
    <header className={styles.header}>

      <div className={styles.title}>
        <AppLogo size="sm" />
        <h1>ISCIz <span>Beta</span></h1>
      </div>

      <div className={styles.headerActions}>
        <Link
          to="/"
          className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          onClick={(e) => handleNavClick(e, "/")}
        >
          Dashboard
        </Link>

        {ready && !isViewer && (
          <Link
            to="/reports"
            className={`${styles.navLink} ${isActive("/reports") ? styles.active : ""}`}
            onClick={(e) => handleNavClick(e, "/reports")}
          >
            Reports
          </Link>
        )}

        {ready && isAdmin && (
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
          <p>{roleLabel}</p>
        </div>
        <ProfileMenu profileImage={profileImage} />
      </div>
    </header>
  )
}




export default Header;