import { useState } from "react";
import styles from "./Matrix.module.scss";

const FIELDS = [
  ["isci", "ISCI and filename"],
  ["length", "Length"],
  ["aspect", "Aspect ratio"],
  ["title", "Spot title"],
  ["language", "Language"],
  ["placement", "Placement"],
  ["partner", "Partner"],
];

const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const MatrixStep = ({
  file, loading, loadError, onFile, wb, sheetIdx, onSheet, hdr, colOptions, jobCell, onColumn,
  rows, maps, placements, onGroup, isBlankTemplate, blocker, onBack, onNext,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const notes = rows.filter((r) => r.kind === "note").length;
  const visibleSheets = wb ? wb.sheets.map((s, i) => ({ s, i })).filter(({ s }) => s.state === "visible") : [];
  const activePlacements = placements.filter((p) => p.active !== false);

  const pick = (list) => {
    const f = list && list[0];
    if (f) onFile(f);
  };

  return (
    <>
      <div className={styles.card}>
        <header className={styles.cardHead}>
          <h2 className={styles.cardTitle}>Matrix file</h2>
        </header>
        <p className={styles.helper}>Drop the deliverables matrix. Codes are added to a copy, your file is not changed.</p>

        <input
          type="file"
          accept=".xlsx,.xlsm"
          id="mx-file"
          className={styles.fileInput}
          onChange={(e) => { pick(e.target.files); e.target.value = ""; }}
        />
        <label
          htmlFor="mx-file"
          className={`${styles.dropzone} ${file ? styles.dropzoneFilled : ""} ${dragOver ? styles.dropzoneDragOver : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files); }}
        >
          <IconFile />
          <span className={styles.dropzoneText}>
            {loading ? "Reading the matrix..." : file ? file.name : "Drop the matrix here or click to choose"}
          </span>
          <span className={styles.dropzoneHint}>
            {file ? "Click or drop to choose a different file" : "Accepts .xlsx and .xlsm files"}
          </span>
        </label>
        {loadError && <div className={styles.errorBox} role="alert">{loadError}</div>}
      </div>

      {file && wb && (
        <div className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Columns matched</h2>
            {visibleSheets.length > 1 && (
              <div className={styles.field}>
                <select value={sheetIdx} onChange={(e) => onSheet(Number(e.target.value))} aria-label="Sheet">
                  {visibleSheets.map(({ s, i }) => (
                    <option key={i} value={i}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </header>

          {!hdr ? (
            <div className={styles.errorBox} role="alert">Could not find the header row on this sheet.</div>
          ) : (
            <>
              <div className={styles.fields}>
                {FIELDS.map(([key, label]) => (
                  <div key={key} className={styles.field}>
                    <label htmlFor={`mx-col-${key}`}>{label}</label>
                    <select
                      id={`mx-col-${key}`}
                      value={hdr.cols[key] ?? ""}
                      onChange={(e) => onColumn(key, e.target.value === "new" ? "new" : e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Not found</option>
                      {colOptions.map((o) => (
                        <option key={o.c} value={o.c}>{o.label}</option>
                      ))}
                      {key === "isci" && <option value="new">Add a new ISCI column</option>}
                    </select>
                  </div>
                ))}
              </div>
              <div className={styles.facts}>
                <span>Header on row <strong>{hdr.row}</strong></span>
                <span>Job cell {jobCell ? <>found in row <strong>{jobCell.r}</strong></> : "not found, the job number is added to the file name"}</span>
                <span><strong>{notes}</strong> note {notes === 1 ? "row" : "rows"} skipped</span>
              </div>
            </>
          )}
        </div>
      )}

      {isBlankTemplate && (
        <div className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>This is the blank template</h2>
          </header>
          <p className={styles.helper}>
            Make a copy for the job, fill in Spot length, Aspect ratio and Version for each deliverable under its placement, then drop that copy here.
          </p>
          <p className={styles.helper}>Rows with a length or aspect ratio are treated as spots; notes and spec rows are skipped.</p>
        </div>
      )}

      {hdr && maps.order.length > 0 && (
        <div className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Placements in this matrix</h2>
          </header>
          <p className={styles.helper}>Each group gets its own media type. Switch a group off to leave it for later.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Placement</th>
                  <th>Partner</th>
                  <th className={styles.num}>Spots</th>
                  <th className={styles.num}>Coded</th>
                  <th>ISCI placement</th>
                  <th>Platform</th>
                  <th>Include</th>
                </tr>
              </thead>
              <tbody>
                {maps.order.map((gk) => {
                  const g = maps.groups[gk];
                  const current = g.placementId || (activePlacements.find((p) => p.mediaType === g.media) || {}).id || "";
                  return (
                    <tr key={gk}>
                      <td>{g.placement || "No placement"}</td>
                      <td className={styles.muted}>{g.partner || "-"}</td>
                      <td className={styles.num}>{g.n}</td>
                      <td className={styles.num}>{g.filled}</td>
                      <td>
                        <select
                          value={current}
                          onChange={(e) => {
                            const p = activePlacements.find((x) => x.id === e.target.value);
                            onGroup(gk, { placementId: e.target.value, media: p ? p.mediaType : g.media });
                          }}
                          aria-label={`ISCI placement for ${g.placement}`}
                        >
                          {!current && <option value="">None available</option>}
                          {activePlacements.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} · {p.mediaType}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={g.platform || ""}
                          onChange={(e) => onGroup(gk, { platform: e.target.value })}
                          aria-label={`Platform for ${g.placement}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.toggle} ${g.on ? styles.toggleOn : ""}`}
                          onClick={() => onGroup(gk, { on: !g.on })}
                          aria-pressed={g.on}
                          aria-label={`Include ${g.placement}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {blocker && <span className={styles.reason}>{blocker}</span>}
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn-primary" disabled={!!blocker} onClick={onNext}>Next</button>
      </div>
    </>
  );
};

export default MatrixStep;
