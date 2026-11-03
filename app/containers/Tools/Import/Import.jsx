import { useState } from "react";
import { useImportData, useConfirmDialog } from "@/hooks";
import ConfirmDialog from "@/components/ConfirmDialog";
import { IconDownload } from "@/components/Icons";
import { CSV_HEADERS } from "../csv";
import styles from "./Import.module.scss";

// Template example rows. Values match the dropdown options in ISCIForm so a
// fresh export/import round-trips cleanly:
//   Placement:     name (Broadcast, Social, ...) or single letter (B, S, ...)
//   Audio:         "Stereo LR" | "Broadcast" | "Digital Streaming" | "Cinema 5:1" | "Digital"
//   Accessibility: "Clean" | "Closed Captions" | "Subtitles"
//   Market:        two-letter code (US, CA, GB, ...) — see app/utils/markets.js
const TEMPLATE_EXAMPLES = [
  [
    "LVCB2699", "LVCVA", "Summer Campaign", "JOB-2026-001",
    "Vegas Summer Spots 30s", "Summer campaign broadcast spot",
    "2026-06-01", "US", "R&R Partners", "English",
    "30", "16:9", "Pro Res", "Broadcast", "Stereo LR", "Clean", "Licensed",
    "", "",
  ],
  [
    "LVCS2698", "LVCVA", "Summer Campaign", "JOB-2026-001",
    "Vegas Summer Spots 15s Cutdown", "15 second cutdown for social",
    "2026-06-15", "US", "R&R Partners", "English",
    "15", "9:16", "H.264", "Social", "Stereo LR", "Subtitles", "Licensed",
    "", "",
  ],
  [
    "LVCR2697", "LVCVA", "Summer Campaign", "JOB-2026-001",
    "Vegas Summer Radio 30s", "Radio companion spot",
    "TBD", "US", "R&R Partners", "Spanish",
    "30", "", "WAV", "R", "Stereo LR", "Clean", "Original",
    "", "",
  ],
];

const downloadCSVTemplate = () => {
  const esc = (v) => { const s = String(v ?? ""); return (s.includes(",") || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : `"${s}"`; };
  const rows = [CSV_HEADERS.join(",")];
  TEMPLATE_EXAMPLES.forEach(row => rows.push(row.map(esc).join(",")));
  const csv = rows.join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  link.download = "isci-import-template.csv";
  link.click();
};

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
  </svg>
);

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

const Import = ({ onImported }) => {
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
          <h1>Import data</h1>
          <p className={styles.pgSub}>
            Upload a CSV to add, update, or replace ISCI codes
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
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
            <button type="button" className="btn-secondary" onClick={downloadCSVTemplate}>
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
              <button type="button" className="btn-text" onClick={clearFile}>
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

export default Import;
