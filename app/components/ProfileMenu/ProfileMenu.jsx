import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { clearUserSession } from "@/utils/auth";
import styles from "./ProfileMenu.module.scss";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          className={styles.arrowIcon}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button onClick={handleEditProfile} className={styles.menuItem}>
            Edit Profile
          </button>
          <button onClick={handleLogout} className={styles.menuItem}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
