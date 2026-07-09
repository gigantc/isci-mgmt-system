import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useFetchData } from "@/hooks";
import styles from "./DataQualityAlerts.module.scss";

/**
 * DataQualityAlerts
 *
 * Reports → Insights → Data quality. Shows codes missing fields critical
 * for licensing or stuck in TBD air-date limbo. Click a code chip to jump
 * to that code's Detail page and fix it.
 */

const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (isoString) => {
  if (!isoString) return null;
  const t = Date.parse(isoString);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / DAY);
};

const buildAlerts = (codes) => {
  const missingAirDate = [];
  const tbdStale = [];
  const missingLength = [];
  const stale = [];

  for (const code of codes) {
    if (!code.airDate) {
      missingAirDate.push(code);
    } else if (code.airDate === "TBD") {
      const age = daysAgo(code.createdAt);
      if (age !== null && age >= 30) tbdStale.push(code);
    }

    if (!code.spotLength) missingLength.push(code);

    const inactiveDays = daysAgo(code.updatedAt);
    if (inactiveDays !== null && inactiveDays >= 90) stale.push(code);
  }

  return [
    {
      id: "missing-air-date",
      label: "Missing air date",
      description: "Codes with no air date set. Blocks talent, music, and stock licensing.",
      severity: "warning",
      codes: missingAirDate,
    },
    {
      id: "tbd-stale",
      label: "TBD air date for 30+ days",
      description: "Codes still marked TBD long after creation. Follow up or set a date.",
      severity: "info",
      codes: tbdStale,
    },
    {
      id: "missing-length",
      label: "Missing spot length",
      description: "Codes without a length. File Name and Slate will render incomplete.",
      severity: "warning",
      codes: missingLength,
    },
    {
      id: "stale",
      label: "No activity for 90+ days",
      description: "Codes untouched for over three months. Worth a review to confirm they're still relevant.",
      severity: "info",
      codes: stale,
    },
  ];
};

const DataQualityAlerts = () => {
  const navigate = useNavigate();
  const { data: codes, loading } = useFetchData("/api/isci");

  const alerts = useMemo(() => buildAlerts(codes || []), [codes]);
  const alertsTotal = alerts.reduce((sum, a) => sum + a.codes.length, 0);

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h2 className={styles.title}>Data quality alerts</h2>
        <p className={styles.subtitle}>
          Codes that need attention. Click any code to jump to its detail page and fix it.
        </p>
      </header>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>Issues</h3>
          <span className={styles.cardBadge}>
            {alertsTotal} {alertsTotal === 1 ? "issue" : "issues"} across {codes.length} {codes.length === 1 ? "code" : "codes"}
          </span>
        </div>

        {alertsTotal === 0 ? (
          <div className={styles.emptyState}>All clear. No data quality issues found.</div>
        ) : (
          <ul className={styles.alertList}>
            {alerts
              .filter((a) => a.codes.length > 0)
              .map((alert) => (
                <li key={alert.id} className={styles.alert}>
                  <div className={styles.alertHead}>
                    <span className={`${styles.severity} ${styles[`severity-${alert.severity}`]}`}>
                      {alert.severity === "warning" ? "!" : "i"}
                    </span>
                    <div className={styles.alertHeadText}>
                      <div className={styles.alertLabel}>
                        {alert.label}
                        <span className={styles.alertCount}>{alert.codes.length}</span>
                      </div>
                      <div className={styles.alertDescription}>{alert.description}</div>
                    </div>
                  </div>
                  <div className={styles.alertCodes}>
                    {alert.codes.slice(0, 20).map((code) => (
                      <button
                        key={code.id}
                        type="button"
                        className={styles.codeChip}
                        onClick={() => navigate(`/isci/${code.code}`)}
                        title={`${code.brand} · ${code.spotTitle}`}
                      >
                        {code.code}
                      </button>
                    ))}
                    {alert.codes.length > 20 && (
                      <span className={styles.codeMore}>
                        + {alert.codes.length - 20} more
                      </span>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DataQualityAlerts;
