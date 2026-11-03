import { useMemo, useRef, useState } from "react";
import { getUserSession } from "@/utils/auth";
import { JOB_RX } from "./jobRules";
import JobStep from "./JobStep";
import MatrixStep from "./MatrixStep";
import TuneStep from "./TuneStep";
import ReviewStep from "./ReviewStep";
import styles from "./Matrix.module.scss";

const STEPS = ["Job", "Matrix", "Tune-up", "Review"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR + 1];
const EMPTY_MAPS = { groups: {}, order: [], titles: {}, langs: {}, lens: {}, sizes: {} };

const fileError = (name) => {
  if (/\.xls$/i.test(name)) return "Old .xls files are not supported. Save the matrix as .xlsx and try again.";
  if (/\.csv$/i.test(name)) return "CSV files are not supported here. Use the .xlsx matrix.";
  return "Use an .xlsx or .xlsm matrix.";
};

const Matrix = ({ brands, placements, onSaved }) => {
  const libRef = useRef(null);
  const loadLib = async () => {
    // jszip lives in this chunk, so no other page downloads it.
    if (!libRef.current) libRef.current = await import("./lib");
    return libRef.current;
  };

  // Job
  const [job, setJob] = useState("");
  const [brandId, setBrandId] = useState("");
  const [campaign, setCampaign] = useState("");
  const [year, setYear] = useState(THIS_YEAR);

  // Matrix
  const [file, setFile] = useState(null);
  const [wb, setWb] = useState(null);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [sheet, setSheet] = useState({ grid: null, hdr: null, jobCell: null });
  const [rows, setRows] = useState([]);
  const [maps, setMaps] = useState(EMPTY_MAPS);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Flow
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [preview, setPreview] = useState({ status: "idle", error: "", items: [] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [done, setDone] = useState(null);

  const brand = brands.find((b) => b.id === brandId) || null;
  const activeBrands = useMemo(() => brands.filter((b) => b.active), [brands]);

  //////////////////////////////////////
  // Loading a matrix

  const extract = (lib, grid, hdr, prev = {}) => {
    if (!hdr) return { rows: [], maps: EMPTY_MAPS };
    const found = lib.extractRows(grid, hdr);
    return { rows: found, maps: lib.buildMaps(found, prev) };
  };

  const loadSheet = async (lib, book, idx) => {
    const grid = await lib.readSheet(book, idx);
    const hdr = lib.detectHeader(grid);
    const jobCell = lib.findJobCell(grid, hdr ? hdr.row : 6);
    const out = extract(lib, grid, hdr);
    setSheet({ grid, hdr, jobCell });
    setRows(out.rows);
    setMaps(out.maps);
  };

  const handleFile = async (f) => {
    setLoadError("");
    if (!/\.xls[xm]$/i.test(f.name)) {
      setLoadError(fileError(f.name));
      return;
    }
    setLoading(true);
    try {
      const lib = await loadLib();
      const buf = await f.arrayBuffer();
      const book = await lib.readWorkbook(buf);
      if (!book.sheets.length) throw new Error("no sheets");
      const idx = Math.max(0, book.sheets.findIndex((s) => s.state === "visible"));
      await loadSheet(lib, book, idx);
      setFile({ name: f.name, buf });
      setWb(book);
      setSheetIdx(idx);
      setReached((r) => Math.min(r, 1));
      setPreview({ status: "idle", error: "", items: [] });
    } catch (err) {
      console.error(err);
      setFile(null);
      setWb(null);
      setSheet({ grid: null, hdr: null, jobCell: null });
      setRows([]);
      setMaps(EMPTY_MAPS);
      setLoadError("Could not read that file. Check that it is a valid Excel workbook.");
    } finally {
      setLoading(false);
    }
  };

  const handleSheet = async (idx) => {
    setSheetIdx(idx);
    await loadSheet(libRef.current, wb, idx);
    setReached((r) => Math.min(r, 1));
  };

  const handleColumn = (field, value) => {
    const cols = { ...sheet.hdr.cols, [field]: value };
    // A combined ISCI and filename column moves together.
    if (field === "isci" && (value === "new" || sheet.hdr.cols.filename === sheet.hdr.cols.isci)) cols.filename = value;
    const hdr = { ...sheet.hdr, cols };
    const out = extract(libRef.current, sheet.grid, hdr, maps.groups);
    setSheet({ ...sheet, hdr });
    setRows(out.rows);
    setMaps(out.maps);
    setReached((r) => Math.min(r, 1));
  };

  const handleGroup = (gk, patch) =>
    setMaps((m) => ({ ...m, groups: { ...m.groups, [gk]: { ...m.groups[gk], ...patch } } }));

  const setMap = (name, key, patch) =>
    setMaps((m) => ({ ...m, [name]: { ...m[name], [key]: typeof patch === "string" ? patch : { ...m[name][key], ...patch } } }));

  //////////////////////////////////////
  // Job changes: the preview depends on client and year, so a loaded file starts over.

  const resetFile = () => {
    setFile(null);
    setWb(null);
    setSheet({ grid: null, hdr: null, jobCell: null });
    setRows([]);
    setMaps(EMPTY_MAPS);
    setPreview({ status: "idle", error: "", items: [] });
    setLoadError("");
    setReached(0);
  };

  const changeBrand = (id) => {
    if (file && id !== brandId) resetFile();
    setBrandId(id);
  };

  const changeYear = (y) => {
    if (file && y !== year) resetFile();
    setYear(y);
  };

  const reset = () => {
    setJob("");
    setBrandId("");
    setCampaign("");
    setYear(THIS_YEAR);
    resetFile();
    setStep(0);
    setDone(null);
    setSaveError("");
  };

  //////////////////////////////////////
  // Derived values and step rules

  const lib = libRef.current;
  const activeRows = useMemo(() => (lib ? lib.activeRows(rows, maps) : []), [lib, rows, maps]);
  const hdr = sheet.hdr;

  const jobBlocker = () => {
    if (!JOB_RX.test(job.trim())) return "Add a valid job number.";
    if (!brand) return "Pick a client.";
    return "";
  };

  const matrixBlocker = () => {
    if (!file) return "Upload the deliverables matrix.";
    if (!hdr) return "No header row found on this sheet.";
    if (!hdr.cols.isci) return "Choose the ISCI column.";
    if (!rows.some((r) => r.include)) return "No spots to code yet.";
    if (activeRows.length === 0) return "Switch on at least one placement.";
    const noPlacement = maps.order.find((gk) => {
      const g = maps.groups[gk];
      return g.on && g.n > 0 && !g.placementId && !placements.some((p) => p.active !== false && p.mediaType === g.media);
    });
    if (noPlacement) return `No active placement for ${maps.groups[noPlacement].placement || "a group"}.`;
    return "";
  };

  const tuneBlocker = () => {
    if (activeRows.some((r) => !(maps.titles[r.tk] && maps.titles[r.tk].label))) return "Every spot needs a title.";
    return "";
  };

  const goTo = (i) => {
    setStep(i);
    setReached((r) => Math.max(r, i));
    setSaveError("");
    if (i === 3) runPreview();
  };

  //////////////////////////////////////
  // Batch API

  const batchBody = (isPreview) => {
    const batchRows = lib.toBatchRows(rows, maps, placements);
    return {
      batchRows,
      body: {
        brandId,
        year,
        campaignName: campaign.trim(),
        jobNumber: job.trim(),
        matrixCodes: lib.matrixCodes(rows),
        createdBy: (() => {
          const u = getUserSession();
          return u ? `${u.firstName} ${u.lastName}` : null;
        })(),
        preview: isPreview,
        rows: batchRows,
      },
    };
  };

  const callBatch = async (body) => {
    const res = await fetch("/api/isci/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || "Could not assign codes.");
    return data.results;
  };

  const withNames = (batchRows, results) => {
    const byKey = new Map(results.map((r) => [r.key, r]));
    return batchRows.map((row) => {
      const { code, reused } = byKey.get(row.key);
      const placement = placements.find((p) => p.id === row.placementId);
      const fileName = lib.buildMatrixFileName({
        code,
        brandName: brand.name,
        campaignName: campaign.trim(),
        includeCampaign: !!campaign.trim(),
        row,
        placementName: placement ? placement.name : "",
      });
      return { key: row.key, row, placementName: placement ? placement.name : "", code, reused, fileName };
    });
  };

  const runPreview = async () => {
    setPreview({ status: "loading", error: "", items: [] });
    try {
      const { batchRows, body } = batchBody(true);
      const results = await callBatch(body);
      setPreview({ status: "ready", error: "", items: withNames(batchRows, results) });
    } catch (err) {
      setPreview({ status: "error", error: err.message, items: [] });
    }
  };

  const outName = () => {
    const base = file.name.replace(/\.xls[xm]$/i, "");
    return (sheet.jobCell ? "" : `${job.trim()}_`) + base + "_ISCI.xlsx";
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      // The workbook is written from the FINAL codes, never from the preview.
      const { batchRows, body } = batchBody(false);
      const results = await callBatch(body);
      const items = withNames(batchRows, results);
      const previewCodes = new Map(preview.items.map((i) => [i.key, i.code]));
      const changed = items.some((i) => previewCodes.get(i.key) !== i.code);
      const drift = changed ? "Some codes differ from the preview because other codes were created in the meantime. The matrix has the final codes." : "";
      let blob;
      try {
        blob = await lib.buildOutput({
          buf: file.buf,
          wb,
          sheetIdx,
          hdr,
          jobCell: sheet.jobCell,
          job: job.trim(),
          results: items.map((i) => ({ r: i.key, code: i.code, fileName: i.fileName })),
          outputType: "blob",
        });
      } catch (err) {
        console.error(err);
        setSaveError("The codes were saved, but the matrix could not be written. Try again: the saved codes are reused.");
        onSaved?.();
        return;
      }
      const name = outName();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setDone({ created: items.filter((i) => !i.reused).length, reused: items.filter((i) => i.reused).length, fileName: name, drift });
      onSaved?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  //////////////////////////////////////
  // Render

  const colOptions = useMemo(() => {
    if (!sheet.hdr || !lib) return [];
    const out = [];
    for (let c = 1; c <= sheet.hdr.lastCol; c++) {
      const text = lib.str(sheet.grid.raw.get(sheet.hdr.row + "," + c));
      out.push({ c, label: text ? `${lib.colLet(c)}: ${text}` : lib.colLet(c) });
    }
    return out;
  }, [sheet, lib]);

  return (
    <section className={styles.section}>
      <header className={styles.pgHead}>
        <div>
          <h1>Deliverables matrix</h1>
          <p className={styles.pgSub}>Fill a spec matrix with ISCI codes and file names</p>
        </div>
      </header>

      <ol className={styles.stepper}>
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? styles.stepOn : i <= reached ? styles.stepDone : ""}>
            <button type="button" disabled={i > reached || i === step || saving} onClick={() => goTo(i)} aria-current={i === step ? "step" : undefined}>
              <span className={styles.stepNum}>{i + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className={styles.scrollBody}>
        {step === 0 && (
          <JobStep
            job={job}
            setJob={setJob}
            brandId={brandId}
            setBrandId={changeBrand}
            campaign={campaign}
            setCampaign={setCampaign}
            year={year}
            setYear={changeYear}
            years={YEARS}
            brands={activeBrands}
            blocker={jobBlocker()}
            onNext={() => goTo(1)}
          />
        )}
        {step === 1 && (
          <MatrixStep
            file={file}
            loading={loading}
            loadError={loadError}
            onFile={handleFile}
            wb={wb}
            sheetIdx={sheetIdx}
            onSheet={handleSheet}
            hdr={hdr}
            colOptions={colOptions}
            jobCell={sheet.jobCell}
            onColumn={handleColumn}
            rows={rows}
            maps={maps}
            placements={placements}
            onGroup={handleGroup}
            blocker={matrixBlocker()}
            onBack={() => goTo(0)}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <TuneStep
            activeRows={activeRows}
            maps={maps}
            onTitle={(k, v) => setMap("titles", k, { label: v })}
            onLength={(k, v) => setMap("lens", k, { value: v })}
            onSize={(k, v) => setMap("sizes", k, { value: v })}
            onLanguage={(k, v) => setMap("langs", k, v)}
            blocker={tuneBlocker()}
            onBack={() => goTo(1)}
            onNext={() => goTo(3)}
          />
        )}
        {step === 3 && (
          <ReviewStep
            status={preview.status}
            error={preview.error}
            items={preview.items}
            saving={saving}
            saveError={saveError}
            done={done}
            onRefresh={runPreview}
            onSave={handleSave}
            onBack={() => goTo(2)}
            onReset={reset}
          />
        )}
      </div>
    </section>
  );
};

export default Matrix;
