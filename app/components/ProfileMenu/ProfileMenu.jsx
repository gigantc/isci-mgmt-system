import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { clearUserSession } from "@/utils/auth";
import Modal from "@/components/Modal";
import AppLogo from "@/components/AppLogo";
import { IconClose } from "@/components/Icons";
import { APP_VERSION } from "@/config";
import styles from "./ProfileMenu.module.scss";

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
            Edit profile
          </button>
          <button onClick={handleAbout} className={styles.menuItem}>
            About
          </button>
          <button onClick={handleLogout} className={styles.menuItem}>
            Logout
          </button>
        </div>
      )}

      <Modal open={showAbout} onClose={handleCloseAbout} label="About ISCIz">
        <button
          type="button"
          className={`btn-icon ${styles.closeButton}`}
          onClick={handleCloseAbout}
          aria-label="Close about dialog"
        >
          <IconClose />
        </button>

        <div className={styles.about}>
          <div className={styles.aboutHeader}>
            <AppLogo size="lg" />
            <h2>ISCIz</h2>
          </div>

          <div className={styles.aboutBody}>
            <p className={styles.version}>Version {APP_VERSION}</p>
            <p className={styles.copyright}>© {currentYear} R&R partners. All Rights Reserved.</p>
            <p className={styles.credit}>Built with ❤️ by Dan Freeman</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileMenu;
