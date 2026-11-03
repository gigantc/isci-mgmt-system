import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useFetchData, useSession } from "@/hooks";
import DataQualityAlerts from "@/components/DataQualityAlerts";
import PlacementMix from "@/components/PlacementMix";
import CreationTrend from "@/components/CreationTrend";
import styles from "./Reports.module.scss";

const TAB_KEY = "isciz-reports-tab";

const Reports = () => {
  const navigate = useNavigate();
  const { user, ready, isViewer } = useSession();
  const [activeTab, setActiveTab] = useState("insights-quality");

  // One codes fetch shared by every insight.
  const { data: codes, loading } = useFetchData("/api/isci");

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
            className={`${styles.sbItem} ${activeTab === "insights-trend" ? styles.sbItemOn : ""}`}
            onClick={() => handleSelect("insights-trend")}
          >
            <span>Creation trend</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.scrollableContent}>
          {activeTab === "insights-quality" && <DataQualityAlerts codes={codes} loading={loading} />}
          {activeTab === "insights-placement" && <PlacementMix codes={codes} loading={loading} />}
          {activeTab === "insights-trend" && <CreationTrend codes={codes} loading={loading} />}
        </div>

        <footer className={styles.footer}>
          <div>
            {activeTab === "insights-quality" && "Data quality alerts"}
            {activeTab === "insights-placement" && "Placement mix by client"}
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
