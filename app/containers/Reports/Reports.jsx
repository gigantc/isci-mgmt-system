import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSession } from "@/hooks";
import DataQualityAlerts from "@/components/DataQualityAlerts";
import PlacementMix from "@/components/PlacementMix";
import CutdownFamilies from "@/components/CutdownFamilies";
import CreationTrend from "@/components/CreationTrend";
import styles from "./Reports.module.scss";

const TAB_KEY = "isciz-reports-tab";

const Reports = () => {
  const navigate = useNavigate();
  const { user, ready, isViewer } = useSession();
  const [activeTab, setActiveTab] = useState("insights-quality");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (isViewer) {
      navigate("/");
      return;
    }
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(TAB_KEY);
      if (
        stored === "insights-quality" ||
        stored === "insights-placement" ||
        stored === "insights-cutdowns" ||
        stored === "insights-trend"
      ) {
        setActiveTab(stored);
      }
    }
  }, [navigate, ready, user, isViewer]);

  const handleSelect = (id) => {
    setActiveTab(id);
    if (typeof window !== "undefined") window.localStorage.setItem(TAB_KEY, id);
  };

  return (
    <div className={styles.reportsPage}>
      <aside className={styles.sidebar}>
        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>Insights</div>
          <button
            type="button"
            className={`${styles.sbItem} ${activeTab === "insights-quality" ? styles.sbItemOn : ""}`}
            onClick={() => handleSelect("insights-quality")}
          >
            <span>Data quality</span>
          </button>
          <button
            type="button"
            className={`${styles.sbItem} ${activeTab === "insights-placement" ? styles.sbItemOn : ""}`}
            onClick={() => handleSelect("insights-placement")}
          >
            <span>Placement mix</span>
          </button>
          <button
            type="button"
            className={`${styles.sbItem} ${activeTab === "insights-cutdowns" ? styles.sbItemOn : ""}`}
            onClick={() => handleSelect("insights-cutdowns")}
          >
            <span>Cutdown families</span>
          </button>
          <button
            type="button"
            className={`${styles.sbItem} ${activeTab === "insights-trend" ? styles.sbItemOn : ""}`}
            onClick={() => handleSelect("insights-trend")}
          >
            <span>Creation trend</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.scrollableContent}>
          {activeTab === "insights-quality" && <DataQualityAlerts />}
          {activeTab === "insights-placement" && <PlacementMix />}
          {activeTab === "insights-cutdowns" && <CutdownFamilies />}
          {activeTab === "insights-trend" && <CreationTrend />}
        </div>

        <footer className={styles.footer}>
          <div>
            {activeTab === "insights-quality" && "Data quality alerts"}
            {activeTab === "insights-placement" && "Placement mix by client"}
            {activeTab === "insights-cutdowns" && "Cutdown families"}
            {activeTab === "insights-trend" && "Codes created over the last 12 months"}
          </div>
          <div>
            Reports ·{" "}
            <button type="button" className={styles.footerLink} onClick={() => navigate("/")}>
              Back to Dashboard →
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Reports;
