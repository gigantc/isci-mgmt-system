import styles from "./Matrix.module.scss";

const isExcelTime = (raw) => typeof raw === "number" && raw > 0 && raw < 1;

const MapTable = ({ title, hint, rows, header }) => (
  <div className={styles.card}>
    <header className={styles.cardHead}>
      <h2 className={styles.cardTitle}>{title}</h2>
    </header>
    <p className={styles.helper}>{hint}</p>
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{header}</th>
            <th>Stored as</th>
            <th className={styles.num}>Rows</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  </div>
);

const TuneStep = ({ activeRows, maps, onTitle, onLength, onSize, onLanguage, onBack, onNext, blocker }) => {
  const count = (key, field) => activeRows.filter((r) => r[field] === key).length;
  const uniq = (field) => [...new Set(activeRows.map((r) => r[field]))];

  return (
    <>
      <MapTable
        title="Spot titles"
        header="In the matrix"
        hint="Edit a title once and it changes on every row that uses it."
        rows={uniq("tk").map((tk) => (
          <tr key={tk}>
            <td>{[...new Set(maps.titles[tk].variants)].join(", ") || "No title"}</td>
            <td>
              <input type="text" value={maps.titles[tk].label} onChange={(e) => onTitle(tk, e.target.value)} aria-label="Stored title" />
            </td>
            <td className={styles.num}>{count(tk, "tk")}</td>
          </tr>
        ))}
      />

      <MapTable
        title="Lengths"
        header="In the matrix"
        hint="Whole seconds. Leave blank for long form."
        rows={uniq("lenK").map((k) => {
          const l = maps.lens[k];
          return (
            <tr key={k}>
              <td>
                {isExcelTime(l.raw) ? `${Math.round(l.raw * 1440)} (Excel turned this into a time)` : String(l.raw ?? "") || "Blank"}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={l.value ?? ""}
                  onChange={(e) => onLength(k, e.target.value === "" ? null : Math.round(Number(e.target.value)))}
                  aria-label="Stored length in seconds"
                />
              </td>
              <td className={styles.num}>{count(k, "lenK")}</td>
            </tr>
          );
        })}
      />

      <MapTable
        title="Sizes"
        header="In the matrix"
        hint="Aspect ratios like 16:9."
        rows={uniq("szK").map((k) => {
          const s = maps.sizes[k];
          return (
            <tr key={k}>
              <td>
                {isExcelTime(s.raw) ? "Excel turned a ratio into a time" : String(s.raw ?? "") || "Blank"}
                {isExcelTime(s.raw) && <div className={styles.warnText}>Check the stored value.</div>}
              </td>
              <td>
                <input type="text" value={s.value ?? ""} onChange={(e) => onSize(k, e.target.value.trim() || null)} aria-label="Stored aspect ratio" />
              </td>
              <td className={styles.num}>{count(k, "szK")}</td>
            </tr>
          );
        })}
      />

      <MapTable
        title="Languages"
        header="In the matrix"
        hint="Full language names. A region can go in brackets, like English (UK)."
        rows={uniq("lk").map((k) => (
          <tr key={k}>
            <td>{k || "Blank"}</td>
            <td>
              <input type="text" value={maps.langs[k] ?? ""} onChange={(e) => onLanguage(k, e.target.value)} aria-label="Stored language" />
            </td>
            <td className={styles.num}>{count(k, "lk")}</td>
          </tr>
        ))}
      />

      <div className={styles.actions}>
        {blocker && <span className={styles.reason}>{blocker}</span>}
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn-primary" disabled={!!blocker} onClick={onNext}>Next</button>
      </div>
    </>
  );
};

export default TuneStep;
