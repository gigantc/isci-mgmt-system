import { useExportData } from "@/hooks";
import { colorForCode } from "@/utils/palette";
import { IconDownload } from "@/components/Icons";
import { CSV_HEADERS } from "../csv";
import styles from "./Export.module.scss";

const fmtDate = (d) => {
  if (!d || d === "TBD") return d || "—";
  const parsed = Date.parse(d);
  if (Number.isNaN(parsed)) return "—";
  const dt = new Date(parsed);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

// ────────────────────────────────────────────────────────────────────────────
// Export section
// ────────────────────────────────────────────────────────────────────────────

const Export = ({ codes, brands, placements, isLoading }) => {
  const {
    filters,
    filteredData,
    filteredCount,
    handleFilterChange,
    resetFilters,
    exportToCSV,
  } = useExportData(codes, {
    initialFilters: {
      dateType: "all",
      startDate: "",
      endDate: "",
      brand: "all",
      channel: "all",
      spotLength: "all",
    },
    filterFunction: (list, f) =>
      list.filter((code) => {
        if (f.dateType !== "all" && f.startDate && f.endDate) {
          const start = new Date(f.startDate);
          const end = new Date(f.endDate);
          let codeDate;
          if (f.dateType === "created") codeDate = new Date(code.createdAt);
          else if (f.dateType === "updated") codeDate = new Date(code.updatedAt);
          else if (f.dateType === "air") {
            if (!code.airDate || code.airDate === "TBD") return false;
            codeDate = new Date(code.airDate);
          }
          if (codeDate < start || codeDate > end) return false;
        }
        if (f.brand !== "all" && code.brand !== f.brand) return false;
        if (f.channel !== "all" && code.placement?.name !== f.channel) return false;
        if (f.spotLength !== "all" && code.spotLength?.toString() !== f.spotLength) return false;
        return true;
      }),
    csvHeaders: CSV_HEADERS,
    csvRowMapper: (c) => [
      // Basic
      c.code, c.brand, c.campaignName || "", c.jobNumber || "",
      // Spot
      c.spotTitle, c.description || "",
      // Schedule & People
      c.airDate || "", c.market || "", c.agency || "", c.language || "",
      // Technical
      c.spotLength || "", c.aspectRatio || "", c.fileFormat || "", c.placement?.name || "", c.audio || "", c.closedCaptioning || "", c.musicRights || "", c.platform || "",
      // System
      c.createdAt, c.updatedAt,
    ],
    filenamePrefix: "isci-codes-export",
  });

  return (
    <section className={styles.section}>
      <header className={styles.pgHead}>
        <div>
          <h1>Export data</h1>
          <p className={styles.pgSub}>
            <strong>{filteredCount}</strong> of {codes.length}
            {" · "}
            export filtered ISCI codes to CSV
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => exportToCSV()}
          disabled={filteredCount === 0 || isLoading}
        >
          <IconDownload /> Export to CSV
        </button>
      </header>

      <div className={styles.scroll}>
        {isLoading ? (
          <div className={styles.emptyState}><p>Loading data…</p></div>
        ) : (
          <>
          <div className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Filters</h2>
              <button type="button" className="btn-text" onClick={resetFilters}>
                Reset
              </button>
            </header>

            <div className={styles.filterGrid}>
              <div className={styles.field}>
                <label htmlFor="rep-dateType">Date filter</label>
                <select id="rep-dateType" name="dateType" value={filters.dateType} onChange={handleFilterChange}>
                  <option value="all">All dates</option>
                  <option value="created">Created date</option>
                  <option value="updated">Updated date</option>
                  <option value="air">Air date</option>
                </select>
              </div>

              {filters.dateType !== "all" && (
                <>
                  <div className={styles.field}>
                    <label htmlFor="rep-startDate">Start date</label>
                    <input
                      type="date"
                      id="rep-startDate"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="rep-endDate">End date</label>
                    <input
                      type="date"
                      id="rep-endDate"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
                  </div>
                </>
              )}

              <div className={styles.field}>
                <label htmlFor="rep-brand">Client</label>
                <select id="rep-brand" name="brand" value={filters.brand} onChange={handleFilterChange}>
                  <option value="all">All clients</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="rep-channel">Placement</label>
                <select id="rep-channel" name="channel" value={filters.channel} onChange={handleFilterChange}>
                  <option value="all">All placements</option>
                  {placements.filter((p) => p.active).map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="rep-spotLength">Spot length</label>
                <select id="rep-spotLength" name="spotLength" value={filters.spotLength} onChange={handleFilterChange}>
                  <option value="all">All lengths</option>
                  <option value="6">6 seconds</option>
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </div>
            </div>

            <footer className={styles.cardFoot}>
              <span className={styles.cardFootHint}>
                <strong>{filteredCount}</strong> of {codes.length} {codes.length === 1 ? "code" : "codes"} match
              </span>
            </footer>
          </div>

          <div className={`${styles.card} ${styles.cardGrow}`}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Preview</h2>
              <span className={styles.cardFootHint}>
                <strong>{filteredCount}</strong> {filteredCount === 1 ? "code" : "codes"} will be exported
              </span>
            </header>

            <div className={styles.previewWrap}>
              {filteredData.length === 0 ? (
                <div className={styles.previewEmpty}>No codes match the current filters.</div>
              ) : (
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>ISCI code</th>
                      <th>Client</th>
                      <th>Campaign</th>
                      <th>Spot title</th>
                      <th className={styles.numHeader}>Length</th>
                      <th>Placement</th>
                      <th>Air date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((code) => (
                      <tr key={code.id}>
                        <td className={styles.previewCode}>{code.code}</td>
                        <td>
                          <span className={styles.previewClient}>
                            <span
                              className={styles.clientDot}
                              style={{ background: code.brandColor || colorForCode(code.brandCode || code.brand) }}
                            />
                            {code.brand}
                          </span>
                        </td>
                        <td className={styles.previewMuted}>{code.campaignName || "—"}</td>
                        <td className={styles.previewTitle}>{code.spotTitle}</td>
                        <td className={styles.previewNum}>{code.spotLength ? `${code.spotLength}s` : "—"}</td>
                        <td className={styles.previewMuted}>{code.placement?.name || "—"}</td>
                        <td className={styles.previewMuted}>{fmtDate(code.airDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Export;
