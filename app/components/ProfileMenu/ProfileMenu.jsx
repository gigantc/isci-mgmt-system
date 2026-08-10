import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { clearUserSession } from "@/utils/auth";
import styles from "./ProfileMenu.module.scss";
import LogoUrl from "@/assets/Logo.svg?url";

const ProfileMenu = ({ profileImage }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const handleAbout = () => {
    setIsOpen(false);
    setShowAbout(true);
  };

  const handleCloseAbout = () => {
    setShowAbout(false);
  };

  const currentYear = new Date().getFullYear();

  const handleLogout = () => {
    setIsOpen(false);
    clearUserSession();
    navigate("/login");
  };

  return (
    <div className={styles.profileMenu} ref={menuRef}>
      <button
        onClick={handleToggle}
        className={styles.menuButton}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <img src={profileImage} alt="" className={styles.avatar} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button onClick={handleEditProfile} className={styles.menuItem}>
            Edit Profile
          </button>
          <button onClick={handleAbout} className={styles.menuItem}>
            About
          </button>
          <button onClick={handleLogout} className={styles.menuItem}>
            Logout
          </button>
        </div>
      )}

      {showAbout && (
        <div className={styles.modalOverlay} onClick={handleCloseAbout}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={handleCloseAbout}
              aria-label="Close about dialog"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className={styles.aboutHeader}>
              <img src={LogoUrl} alt="ISCIz Logo" className={styles.logo} />
              <h2>ISCIz</h2>
            </div>

            <div className={styles.aboutBody}>
              <p className={styles.version}>Version 1.2.0</p>
              <p className={styles.copyright}>© {currentYear} R&R partners. All Rights Reserved.</p>
              <p className={styles.credit}>Built with ❤️ by Dan Freeman</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
