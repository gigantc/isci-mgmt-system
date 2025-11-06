import { useState, useEffect } from "react";
import { getUserSession } from "@/utils/auth";
import ProfileMenu from "@/components/ProfileMenu";
import styles from "./Header.module.scss";
import { ReactComponent as Logo } from "./assets/Logo.svg";
import DefaultProfileImage from "./assets/default_profile_image.jpg";

const Header = ({
  showAdminButton = true,
  showCreateButton = true,
  showBackButton = false
}) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Only run on client side after hydration
    setUser(getUserSession());
  }, []);

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
        {showBackButton && (
          <a href="/" className="btn-text">
           Dashboard
          </a>
        )}

        <a href="/admin" className="btn-text">
          Reports
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
        <img src={profileImage} alt="Profile" />
        <ProfileMenu />
      </div>
    </header>
  )
}




export default Header;