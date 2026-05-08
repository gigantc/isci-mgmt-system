import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import BrandManager from "@/components/BrandManager";
import UserManager from "@/components/UserManager";
import AgencyManager from "@/components/AgencyManager";
import { isAuthenticated, isAdmin } from "@/utils/auth";
import { useFetchData } from "@/hooks";
import styles from "./Admin.module.scss";

const TAB_KEY = "isciz-admin-tab";

const SECTIONS = [
  { id: "brands", label: "Clients" },
  { id: "agencies", label: "Agencies" },
  { id: "users", label: "Users" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("brands");

  // Load counts for the sidebar
  const { data: brands } = useFetchData("/api/brands");
  const { data: agencies } = useFetchData("/api/agencies");
  const { data: users } = useFetchData("/api/users");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (!isAdmin()) {
      navigate("/");
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(TAB_KEY);
      if (stored && SECTIONS.some((s) => s.id === stored)) {
        setActiveTab(stored);
      }
    }
  }, [navigate]);

  const handleSelect = (id) => {
    setActiveTab(id);
    if (typeof window !== "undefined") window.localStorage.setItem(TAB_KEY, id);
  };

  const counts = {
    brands: brands.length,
    agencies: agencies.length,
    users: users.length,
  };

  return (
    <div className={styles.adminPage}>
      <aside className={styles.sidebar}>
        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>Admin</div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.sbItem} ${activeTab === s.id ? styles.sbItemOn : ""}`}
              onClick={() => handleSelect(s.id)}
            >
              <span>{s.label}</span>
              <span className={styles.sbCount}>{counts[s.id]}</span>
            </button>
          ))}
        </div>

        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>System</div>
          <div className={`${styles.sbItem} ${styles.sbItemDisabled}`} aria-disabled="true">
            <span>Roles</span>
            <span className={styles.sbCount}>2</span>
          </div>
          <div className={`${styles.sbItem} ${styles.sbItemDisabled}`} aria-disabled="true">
            <span>Audit log</span>
            <span className={`${styles.sbCount} ${styles.sbCountSoon}`}>soon</span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={`${styles.scrollableContent} ${styles.scrollableContentFlush}`}>
          {activeTab === "brands" && <BrandManager />}
          {activeTab === "agencies" && <AgencyManager />}
          {activeTab === "users" && <UserManager />}
        </div>

        <footer className={styles.footer}>
          <div>
            {activeTab === "brands" && `${counts.brands} ${counts.brands === 1 ? "client" : "clients"}`}
            {activeTab === "agencies" && `${counts.agencies} ${counts.agencies === 1 ? "agency" : "agencies"}`}
            {activeTab === "users" && `${counts.users} ${counts.users === 1 ? "user" : "users"}`}
          </div>
          <div>
            Admin ·{" "}
            <button type="button" className={styles.footerLink} onClick={() => navigate("/")}>
              Back to Dashboard →
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Admin;
