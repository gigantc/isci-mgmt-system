import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import BrandManager from "@/components/BrandManager";
import UserManager from "@/components/UserManager";
import Header from "@/containers/Header";
import { isAuthenticated, isAdmin } from "@/utils/auth";
import styles from "./admin.module.scss";

export const meta = () => {
  return [
    { title: "Admin Panel | ISCI Management" },
    { name: "description", content: "Manage brands, clients, and users" },
  ];
};

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("brands");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else if (!isAdmin()) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className={styles.adminPage}>
      <Header />

      <div className={styles.pageContent}>
        {/* Sticky header section */}
        <div className={styles.stickyHeader}>
          <h2>Admin Panel</h2>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "brands" ? styles.active : ""}`}
              onClick={() => setActiveTab("brands")}
            >
              Brand Management
            </button>
            <button
              className={`${styles.tab} ${activeTab === "users" ? styles.active : ""}`}
              onClick={() => setActiveTab("users")}
            >
              User Management
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className={styles.scrollableContent}>
          {activeTab === "brands" && <BrandManager />}
          {activeTab === "users" && <UserManager />}
        </div>
      </div>
    </div>
  );
}
