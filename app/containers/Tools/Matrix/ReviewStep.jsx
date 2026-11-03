import { useState } from "react";
import { Link } from "react-router";
import { MEDIA_TYPES, parseISCI } from "@/utils/isci";
import styles from "./Matrix.module.scss";

const FILTERS = [
  ["all", "All"],
  ["new", "New"],
  ["reused", "Reused"],
];

// "LVCT-2605H to LVCT-2606H" per media type, for the new codes only.
const newRanges = (items) =>
  MEDIA_TYPES.map(({ value, label }) => {
    const codes = items
      .filter((i) => !i.reused && parseISCI(i.code)?.type === value)
      .map((i) => i.code);
    return codes.length ? { value, label, first: codes[0], last: codes[codes.length - 1], n: codes.length } : null;
  }).filter(Boolean);

const ReviewStep = ({ status, error, items, saving, saveError, done, onRefresh, onSave, onBack, onReset }) => {
  const [filter, setFilter] = useState("all");
  const nNew = items.filter((i) => !i.reused).length;
  const nReused = items.length - nNew;
  const shown = items.filter((i) => filter === "all" || (filter === "new" ? !i.reused : i.reused));
  const ranges = newRanges(items);

  if (done) {
    return (
      <div className={`${styles.card} ${styles.doneCard}`}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Matrix downloaded</h2>
        </header>
        <p className={styles.helper}>
          Saved <strong>{done.created}</strong> new {done.created === 1 ? "code" : "codes"}
          {done.reused > 0 && <> and reused <strong>{done.reused}</strong></>}. The matrix was downloaded as{" "}
          <span className={styles.mono}>{done.fileName}</span>.
        </p>
        {done.drift && <div className={styles.noteBox}>{done.drift}</div>}
        <div className={styles.actions}>
          <Link to="/" className="btn-secondary">Open the Dashboard</Link>
          <button type="button" className="btn-primary" onClick={onReset}>Start another matrix</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Review</h2>
          <button type="button" className="btn-secondary" onClick={onRefresh} disabled={status === "loading" || saving}>
            Refresh preview
          </button>
        </header>
        <p className={styles.helper}>This is a preview. Nothing is saved until you download the matrix.</p>

        {status === "loading" && <p className={styles.helper}>Working out the codes...</p>}
        {status === "error" && <div className={styles.errorBox} role="alert">{error}</div>}

        {status === "ready" && (
          <>
            <div className={styles.facts}>
              <span><strong>{nNew}</strong> new</span>
              <span><strong>{nReused}</strong> reused</span>
            </div>
            {ranges.length > 0 && (
              <ul className={styles.rangeList}>
                {ranges.map((r) => (
                  <li key={r.value}>
                    {r.label}: <span className={styles.code}>{r.first}</span>
                    {r.n > 1 && <> to <span className={styles.code}>{r.last}</span></>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {status === "ready" && (
        <>
          <div className={styles.chips} role="group" aria-label="Filter rows">
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" className={filter === id ? styles.chipOn : ""} onClick={() => setFilter(id)} aria-pressed={filter === id}>
                {label}
                <span className={styles.chipCount}>{id === "all" ? items.length : id === "new" ? nNew : nReused}</span>
              </button>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.num}>Row</th>
                  <th>Placement</th>
                  <th>Title</th>
                  <th className={styles.num}>Length</th>
                  <th>Size</th>
                  <th>Language</th>
                  <th>Platform</th>
                  <th>ISCI</th>
                  <th>Status</th>
                  <th>File name</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.key}>
                    <td className={styles.num}>{i.key}</td>
                    <td>{i.placementName}</td>
                    <td>{i.row.spotTitle}</td>
                    <td className={styles.num}>{i.row.spotLength != null ? `${i.row.spotLength}s` : "-"}</td>
                    <td>{i.row.aspectRatio || "-"}</td>
                    <td>{i.row.language}</td>
                    <td>{i.row.platform || "-"}</td>
                    <td className={styles.code}>{i.code}</td>
                    <td>
                      <span className={`${styles.badge} ${i.reused ? styles.badgeWarn : styles.badgeOk}`}>{i.reused ? "Reused" : "New"}</span>
                    </td>
                    <td className={styles.fileName}>{i.fileName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {saveError && <div className={styles.errorBox} role="alert">{saveError}</div>}

      <div className={styles.actions}>
        <button type="button" className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <button type="button" className="btn-primary" onClick={onSave} disabled={status !== "ready" || items.length === 0 || saving}>
          {saving ? "Saving..." : "Save codes and download matrix"}
        </button>
      </div>
    </>
  );
};

export default ReviewStep;
