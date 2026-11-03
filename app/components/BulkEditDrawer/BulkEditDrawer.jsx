import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/Drawer";
import { IconWarn } from "@/components/Icons";
import { useFetchData } from "@/hooks";
import { MARKET_OPTIONS } from "@/utils/markets";
import styles from "./BulkEditDrawer.module.scss";

const LIST_PREVIEW = 8;
const MIXED = "Mixed values";

// Bulk-editable fields. Identity fields (code, client, placement, length, aspect
// ratio) are deliberately absent: they differ per cut.
const FIELDS = [
  { key: "jobNumber", label: "Job number", kind: "text" },
  { key: "campaignName", label: "Campaign name", kind: "text" },
  { key: "spotTitle", label: "Spot title", kind: "text", required: true },
  { key: "description", label: "Description", kind: "textarea" },
  { key: "airDate", label: "Air date", kind: "date" },
  { key: "agency", label: "Agency", kind: "select" },
  { key: "market", label: "Market", kind: "select" },
  { key: "platform", label: "Platform", kind: "text", list: true },
  { key: "language", label: "Language", kind: "text", required: true, list: true },
  { key: "closedCaptioning", label: "Accessibility", kind: "select", required: true, options: ["Clean", "Closed Captions", "Subtitles"] },
  { key: "audio", label: "Audio", kind: "select", required: true, options: ["Stereo LR", "Broadcast", "Digital Streaming", "Cinema 5:1", "Digital"] },
  { key: "fileFormat", label: "File format", kind: "select", required: true, options: ["Pro Res", "MP4", "MP3", "QT", "WAV", "H.264"] },
  { key: "musicRights", label: "Music rights", kind: "select", options: ["Licensed", "Original", "None"] },
  { key: "completedAt", label: "Completion", kind: "complete" },
];

const readValue = (code, key) => {
  if (key === "airDate") return !code.airDate ? "" : code.airDate === "TBD" ? "TBD" : String(code.airDate).split("T")[0];
  if (key === "completedAt") return code.completedAt ? "complete" : "incomplete";
  return code[key] ?? "";
};

const BulkEditDrawer = ({ open, onClose, codes, userName, onApplied }) => {
  const [edits, setEdits] = useState({}); // field -> new value, only for fields the user touched
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: agencies } = useFetchData("/api/agencies", { filter: (list) => list.filter((a) => a.active) });

  // Start clean each time the drawer opens.
  useEffect(() => {
    if (open) {
      setEdits({});
      setError("");
      setSuccess("");
      setShowAll(false);
    }
  }, [open]);

  // The shared value per field: the value when every selected code agrees, else null (mixed).
  const shared = useMemo(() => {
    const out = {};
    for (const f of FIELDS) {
      const first = codes.length ? readValue(codes[0], f.key) : "";
      out[f.key] = codes.every((c) => readValue(c, f.key) === first) ? first : null;
    }
    return out;
  }, [codes]);

  const options = useMemo(() => {
    const out = {};
    for (const f of FIELDS) {
      const seen = [...new Set(codes.map((c) => c[f.key]).filter(Boolean))];
      if (f.key === "agency") out.agency = [...new Set([...agencies.map((a) => a.name), ...seen])];
      else if (f.key === "market") out.market = [...MARKET_OPTIONS.map((m) => ({ value: m.code, label: `${m.name} (${m.code})` })), ...seen.filter((s) => !MARKET_OPTIONS.some((m) => m.code === s)).map((s) => ({ value: s, label: s }))];
      else if (f.options) out[f.key] = [...new Set([...f.options, ...seen])];
    }
    return out;
  }, [codes, agencies]);

  // Suggestions for the free-text fields that use a datalist.
  const suggestions = useMemo(
    () => ({
      platform: [...new Set(codes.map((c) => c.platform).filter(Boolean))],
      language: ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Mandarin", "Cantonese", "Arabic"],
    }),
    [codes]
  );

  const changedKeys = Object.keys(edits);
  const invalid = changedKeys.some((k) => FIELDS.find((f) => f.key === k).required && !String(edits[k]).trim());
  const n = codes.length;

  const setEdit = (key, value) => {
    setSuccess("");
    setEdits((e) => ({ ...e, [key]: value }));
  };
  const reset = (key) => setEdits((e) => {
    const { [key]: _gone, ...rest } = e;
    return rest;
  });

  // The API value for an edited field.
  const toChange = (key, value) => {
    if (key === "completedAt") return value === "complete" ? new Date().toISOString() : null;
    return value;
  };

  const handleApply = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const changes = Object.fromEntries(changedKeys.map((k) => [k, toChange(k, edits[k])]));
      const res = await fetch("/api/isci/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: codes.map((c) => c.id), changes, updatedBy: userName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Could not update the codes.");
      onApplied?.(data.isciCodes);
      setEdits({});
      setSuccess(`Updated ${data.count} ${data.count === 1 ? "code" : "codes"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const valueOf = (f) => (f.key in edits ? edits[f.key] : shared[f.key] ?? "");

  const renderControl = (f) => {
    const id = `bulk-${f.key}`;
    const mixed = shared[f.key] === null && !(f.key in edits);
    const value = valueOf(f);
    const onChange = (e) => setEdit(f.key, e.target.value);

    if (f.kind === "textarea") {
      return <textarea id={id} rows={3} value={value} onChange={onChange} placeholder={mixed ? MIXED : ""} />;
    }
    if (f.kind === "date") {
      const tbd = value === "TBD";
      return (
        <>
          <input id={id} type="date" value={tbd ? "" : value} onChange={onChange} disabled={tbd} />
          <label className={styles.check}>
            <input type="checkbox" checked={tbd} onChange={(e) => setEdit(f.key, e.target.checked ? "TBD" : "")} />
            TBD
          </label>
        </>
      );
    }
    if (f.kind === "complete") {
      return (
        <select id={id} value={value} onChange={onChange}>
          {mixed && <option value="">{MIXED}</option>}
          <option value="incomplete">Not complete</option>
          <option value="complete">Complete</option>
        </select>
      );
    }
    if (f.kind === "select") {
      const list = options[f.key] || [];
      return (
        <select id={id} value={value} onChange={onChange}>
          {(mixed || (!f.required && value === "")) && <option value="">{mixed ? MIXED : "Not specified"}</option>}
          {list.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const label = typeof o === "string" ? o : o.label;
            return <option key={v} value={v}>{label}</option>;
          })}
        </select>
      );
    }
    return (
      <>
        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={mixed ? MIXED : ""}
          list={f.list ? `${id}-list` : undefined}
        />
        {f.list && (
          <datalist id={`${id}-list`}>
            {(suggestions[f.key] || []).map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </>
    );
  };

  const shown = showAll ? codes : codes.slice(0, LIST_PREVIEW);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Edit ${n} ${n === 1 ? "code" : "codes"}`}
      subtitle="Only the fields you change are written."
      footer={
        <>
          <div className={styles.status}>
            {error && <span className={styles.error} role="alert">{error}</span>}
            {success && <span className={styles.ok} role="status">{success}</span>}
          </div>
          <div className={styles.footerRight}>
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button type="button" className="btn-primary" disabled={changedKeys.length === 0 || invalid || saving} onClick={handleApply}>
              {saving ? "Applying..." : `Apply to ${n} ${n === 1 ? "code" : "codes"}`}
            </button>
          </div>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.codes}>
          <ul>
            {shown.map((c) => <li key={c.id}>{c.code}</li>)}
          </ul>
          {n > LIST_PREVIEW && (
            <button type="button" className="btn-text" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${n}`}
            </button>
          )}
        </div>

        {FIELDS.map((f) => {
          const changed = f.key in edits;
          return (
            <div key={f.key} className={`${styles.field} ${changed ? styles.changed : ""}`}>
              <div className={styles.labelRow}>
                <label htmlFor={`bulk-${f.key}`}>{f.label}</label>
                {changed && <button type="button" className="btn-text" onClick={() => reset(f.key)}>Reset</button>}
              </div>
              {renderControl(f)}
              {f.key === "completedAt" && codes.some((c) => !c.completedAt) && codes.some((c) => c.completedAt) && (
                <span className={styles.hint}>Codes already complete keep their date.</span>
              )}
              {f.key === "spotTitle" && changed && (
                <div className={styles.warn}>
                  <IconWarn />
                  <span>Spot title identifies each cut. Changing it renames all {n} selected codes.</span>
                </div>
              )}
              {changed && f.required && !String(edits[f.key]).trim() && (
                <span className={styles.fieldError}>{f.label} cannot be empty.</span>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};

export default BulkEditDrawer;
