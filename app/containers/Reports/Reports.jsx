import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated, getUserSession } from "@/utils/auth";
import { useFetchData, useExportData, useImportData, useConfirmDialog } from "@/hooks";
import { colorForCode } from "@/utils/palette";
import ConfirmDialog from "@/components/ConfirmDialog";
import styles from "./Reports.module.scss";

const CSV_HEADERS = [
  // Basic
  "ISCI Code", "Client", "Campaign Name", "Job Number",
  // Spot
  "Spot Title", "Description",
  // Schedule & People
  "Air Date", "Market", "Agency", "Language",
  // Technical
  "Spot Length", "Aspect Ratio", "File Format", "Channel", "Audio", "Accessibility", "Music Rights",
  // System
  "Created At", "Updated At",
];

const downloadCSVTemplate = () => {
  const example = [
    "LVCI2599", "Las Vegas Convention and Visitors Authority", "Summer Campaign", "JOB-2025-001",
    "Vegas Summer Spots 30s", "Summer campaign spot",
    "2025-06-01", "GLOBAL", "R&R Partners", "English",
    "30", "16:9", "Pro Res", "Broadcast", "Stereo LR", "Clean", "Licensed",
    "", "",
  ];
  const esc = (v) => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : `"${s}"`; };
  const csv = [CSV_HEADERS.join(","), example.map(esc).join(",")].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  link.download = "isci-import-template.csv";
  link.click();
};

const fmtDate = (d) => {
  if (!d || d === "TBD") return d || "—";
  const parsed = Date.parse(d);
  if (Number.isNaN(parsed)) return "—";
  const dt = new Date(parsed);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
};

const TAB_KEY = "isciz-reports-tab";

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
  </svg>
);

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("export");

  const { data: codes, loading: codesLoading, refetch: loadData } = useFetchData("/api/isci");
  const { data: brands, loading: brandsLoading } = useFetchData("/api/brands");
  const isLoading = codesLoading || brandsLoading;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    const currentUser = getUserSession();
    setUser(currentUser);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(TAB_KEY);
      const isAdmin = currentUser?.userType === "admin";
      if (stored === "export" || (stored === "import" && isAdmin)) {
        setActiveTab(stored);
      }
    }
  }, [navigate]);

  const isUserAdmin = user?.userType === "admin";

  const handleSelect = (id) => {
    setActiveTab(id);
    if (typeof window !== "undefined") window.localStorage.setItem(TAB_KEY, id);
  };

  const SECTIONS = [
    { id: "export", label: "Export", adminOnly: false },
    { id: "import", label: "Import", adminOnly: true },
  ].filter((s) => !s.adminOnly || isUserAdmin);

  return (
    <div className={styles.reportsPage}>
      <aside className={styles.sidebar}>
        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>Reports</div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.sbItem} ${activeTab === s.id ? styles.sbItemOn : ""}`}
              onClick={() => handleSelect(s.id)}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.sbGroup}>
          <div className={styles.sbLabel}>System</div>
          <div className={`${styles.sbItem} ${styles.sbItemDisabled}`} aria-disabled="true">
            <span>Insights</span>
            <span className={`${styles.sbCount} ${styles.sbCountSoon}`}>soon</span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.scrollableContent}>
          {activeTab === "export" && (
            <ExportSection
              codes={codes}
              brands={brands}
              isLoading={isLoading}
            />
          )}
          {activeTab === "import" && isUserAdmin && (
            <ImportSection onImported={loadData} />
          )}
        </div>

        <footer className={styles.footer}>
          <div>
            {activeTab === "export" && `${codes.length} ${codes.length === 1 ? "code" : "codes"} available`}
            {activeTab === "import" && "CSV import"}
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

// ────────────────────────────────────────────────────────────────────────────
// Export section
// ────────────────────────────────────────────────────────────────────────────

const ExportSection = ({ codes, brands, isLoading }) => {
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
        if (f.channel !== "all" && code.channel !== f.channel) return false;
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
      c.spotLength || "", c.aspectRatio || "", c.fileFormat || "", c.channel || "", c.audio || "", c.closedCaptioning || "", c.musicRights || "",
      // System
      c.createdAt, c.updatedAt,
    ],
    filenamePrefix: "isci-codes-export",
  });

  return (
    <section className={styles.section}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Export Data</h1>
          <p className={styles.pgSub}>
            <strong>{filteredCount}</strong> of {codes.length}
            {" · "}
            export filtered ISCI codes to CSV
          </p>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
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
              <button type="button" className={styles.btnText} onClick={resetFilters}>
                Reset
              </button>
            </header>

            <div className={styles.filterGrid}>
              <div className={styles.field}>
                <label htmlFor="rep-dateType">Date Filter</label>
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
                <label htmlFor="rep-channel">Channel</label>
                <select id="rep-channel" name="channel" value={filters.channel} onChange={handleFilterChange}>
                  <option value="all">All channels</option>
                  <option value="Broadcast">Broadcast</option>
                  <option value="CTV">CTV</option>
                  <option value="Digital">Digital</option>
                  <option value="Social">Social</option>
                  <option value="OLV">OLV</option>
                  <option value="Radio">Radio</option>
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

          <div className={styles.card}>
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
                      <th>ISCI Code</th>
                      <th>Client</th>
                      <th>Campaign</th>
                      <th>Spot Title</th>
                      <th>Len</th>
                      <th>Placement</th>
                      <th>Air Date</th>
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
                        <td className={styles.previewMuted}>{code.channel || "—"}</td>
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

// ────────────────────────────────────────────────────────────────────────────
// Import section
// ────────────────────────────────────────────────────────────────────────────

const IMPORT_MODES = [
  {
    id: "add",
    label: "Add new codes only",
    desc: "Skip codes that already exist in the database.",
  },
  {
    id: "update",
    label: "Update existing codes",
    desc: "Overwrite codes that match by ISCI code; add any new ones.",
  },
  {
    id: "replace",
    label: "Replace all data",
    desc: "Delete every existing code and replace with the imported file.",
    danger: true,
  },
];

const IMPORT_MODE_CONFIRM = {
  add: {
    title: "Import new codes",
    message: (rows) => `Add ${rows} row${rows !== 1 ? "s" : ""}? Codes that already exist will be skipped.`,
    confirmText: "Import",
    isDangerous: false,
  },
  update: {
    title: "Import and update codes",
    message: (rows) => `Import ${rows} row${rows !== 1 ? "s" : ""}? Existing codes that match by ISCI code will be overwritten.`,
    confirmText: "Import",
    isDangerous: false,
  },
  replace: {
    title: "Replace all data",
    message: (rows) => `This will delete every existing ISCI code and replace them with the ${rows} row${rows !== 1 ? "s" : ""} in this file. This cannot be undone.`,
    confirmText: "Delete and replace",
    isDangerous: true,
  },
};

const ImportSection = ({ onImported }) => {
  const { dialogProps, confirm } = useConfirmDialog();
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    file: importFile,
    preview: importPreview,
    result: importResult,
    mode: importMode,
    isImporting,
    handleFileUpload,
    handleFileDrop,
    handleImport,
    setMode: setImportMode,
    clearFile,
  } = useImportData({
    endpoint: "/api/isci/import",
    defaultMode: "add",
    onSuccess: () => onImported?.(),
  });

  const handleImportWithConfirm = async () => {
    const cfg = IMPORT_MODE_CONFIRM[importMode];
    const rows = importPreview?.rowCount ?? 0;
    const ok = await confirm({
      title: cfg.title,
      message: cfg.message(rows),
      confirmText: cfg.confirmText,
      cancelText: "Cancel",
      isDangerous: cfg.isDangerous,
    });
    if (ok) handleImport();
  };

  return (
    <section className={styles.section}>
      <header className={styles.pgHead}>
        <div>
          <h1 className={styles.pgTitle}>Import Data</h1>
          <p className={styles.pgSub}>
            Upload a CSV to add, update, or replace ISCI codes
          </p>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleImportWithConfirm}
          disabled={!importFile || isImporting}
        >
          <IconUpload /> {isImporting ? "Importing…" : "Import CSV"}
        </button>
      </header>

      <div className={styles.scroll}>
        <div className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Mode</h2>
          </header>

          <div className={styles.modeOptions}>
            {IMPORT_MODES.map((m) => {
              const on = importMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.modeCard} ${on ? styles.modeCardOn : ""} ${m.danger ? styles.modeCardDanger : ""}`}
                  onClick={() => setImportMode(m.id)}
                  aria-pressed={on}
                >
                  <span className={styles.modeRadio} aria-hidden="true">
                    <span className={styles.modeRadioDot} />
                  </span>
                  <span className={styles.modeText}>
                    <span className={styles.modeLabel}>{m.label}</span>
                    <span className={styles.modeDesc}>{m.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.cardTitle}>File</h2>
            <button type="button" className={styles.btnSecondary} onClick={downloadCSVTemplate}>
              <IconDownload /> Download template
            </button>
          </header>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            id="rep-csvUpload"
            className={styles.fileInput}
          />
          <label
            htmlFor="rep-csvUpload"
            className={`${styles.dropzone} ${importFile ? styles.dropzoneFilled : ""} ${isDragOver ? styles.dropzoneDragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
            onDrop={(e) => { setIsDragOver(false); handleFileDrop(e); }}
          >
            <IconFile />
            <span className={styles.dropzoneText}>
              {importFile ? importFile.name : "Drop CSV here or click to choose"}
            </span>
            <span className={styles.dropzoneHint}>
              {importFile ? "Click or drop to choose a different file" : "Accepts .csv files"}
            </span>
          </label>

          {importPreview && (
            <div className={styles.previewRow}>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>File</span>
                <span className={styles.previewValue}>{importPreview.fileName}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Size</span>
                <span className={styles.previewValue}>{importPreview.fileSize}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewLabel}>Rows</span>
                <span className={styles.previewValue}>{importPreview.rowCount}</span>
              </div>
              <button type="button" className={styles.btnText} onClick={clearFile}>
                Clear
              </button>
            </div>
          )}
        </div>

        {importResult && (
          <div
            className={`${styles.card} ${styles.resultCard} ${importResult.success ? styles.resultSuccess : styles.resultError}`}
          >
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                {importResult.success ? "Import successful" : "Import failed"}
              </h2>
            </header>
            <p className={styles.resultMessage}>{importResult.message}</p>
            {importResult.skipped > 0 && (
              <p className={styles.resultMessage}>Skipped {importResult.skipped} existing codes.</p>
            )}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className={styles.errorList}>
                <p className={styles.errorListTitle}>
                  Errors ({importResult.errors.length}):
                </p>
                <ul>
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                </ul>
                {importResult.errors.length > 5 && (
                  <p className={styles.errorListMore}>
                    + {importResult.errors.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </section>
  );
};

export default Reports;
