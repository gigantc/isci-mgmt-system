import { useEffect } from "react";
import { useNavigate } from "react-router";
import BrandManager from "@/components/BrandManager";
import Header from "@/containers/Header";
import { isAuthenticated, isAdmin } from "@/utils/auth";
import styles from "./admin.module.scss";

export const meta = () => {
  return [
    { title: "Admin - Brand Management | ISCI Management" },
    { name: "description", content: "Manage brands and clients" },
  ];
};

export default function Admin() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else if (!isAdmin()) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className={styles.adminPage}>
      <Header
        showAdminButton={false}
        showCreateButton={false}
        showBackButton={true}
      />

      <div className={styles.pageContent}>
        {/* Sticky header section */}
        <div className={styles.stickyHeader}>
          <h2>Brand Management</h2>
        </div>

        {/* Scrollable content area */}
        <div className={styles.scrollableContent}>
          <BrandManager />
        </div>
      </div>
    </div>
  );
}
