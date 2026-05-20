import { useRef, useEffect, useState } from "react";
import { getMarketLabel } from "@/utils/markets";
import styles from "./Slate.module.scss";

const Slate = ({ code }) => {
  const canvasRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState(null);

  // Format date as MM-DD-YY
  const formatDate = (dateString) => {
    if (!dateString || dateString === "TBD") return "TBD";
    const parsed = Date.parse(dateString);
    if (Number.isNaN(parsed)) return "TBD";
    const date = new Date(parsed);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
  };

  // Format spot length as :30 format
  const formatLength = (length) => {
    if (!length) return "N/A";
    const numeric = Number(length);
    if (Number.isNaN(numeric)) return String(length);
    return numeric < 10 ? `0${numeric}` : `${numeric}`;
  };

  useEffect(() => {
    if (!canvasRef.current || !code) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size to 1920x1080
    canvas.width = 1920;
    canvas.height = 1080;

    // Black background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // White text
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";

    // Title - Build full title with spot length and version
    const titleParts = [
      code.brand?.replace(/\s+/g, "_") || "Unknown",
      code.spotTitle?.replace(/\s+/g, "_") || "Untitled",
      formatLength(code.spotLength).replace(":", "") + "s",
      code.description ? "With_Details" : "No_Disclaimer"
    ];
    const fullTitle = titleParts.join("_");

    // Field data
    const fields = [
      { label: "ISCI CODE:", value: code.code || "N/A" },
      { label: "CLIENT:", value: code.brand || "N/A" },
      { label: "CAMPAIGN:", value: code.campaignName || "N/A" },
      { label: "SPOT TITLE:", value: code.spotTitle || "N/A" },
      { label: "LENGTH:", value: formatLength(code.spotLength) },
      { label: "AIR DATE:", value: formatDate(code.airDate) },
      { label: "AUDIO:", value: code.audio || "STEREO LR" },
      { label: "LANGUAGE:", value: code.language || "ENGLISH" },
      { label: "MARKET:", value: getMarketLabel(code.market) || "N/A" },
      { label: "ASPECT RATIO:", value: code.aspectRatio || "N/A" },
      { label: "AGENCY:", value: code.agency || "N/A" },
      { label: "DELIVERY FORMAT:", value: code.fileFormat || "N/A" },
      { label: "ACCESSIBILITY:", value: code.closedCaptioning || "N/A" }
    ];

    // Starting position - more centered
    let y = 140;
    const lineHeight = 70;
    const labelX = 200;
    const valueX = 620;
    const maxWidth = 1720; // Maximum width for text (1920 - 200 margin)

    // Helper function to wrap text if it's too long
    const wrapText = (text, maxWidth) => {
      const words = text.split('_');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + '_' + words[i];
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    // Draw each field
    fields.forEach((field, index) => {
      // Label
      ctx.font = "bold 34px Inter, sans-serif";
      ctx.fillText(field.label, labelX, y);

      // Value - special handling for Title field
      ctx.font = "400 34px Inter, sans-serif";

      if (field.label === "SPOT TITLE:") {
        // Wrap title if it's too long
        const availableWidth = maxWidth - valueX;
        const lines = wrapText(field.value, availableWidth);

        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, valueX, y + (lineIndex * 46));
        });

        // Add extra spacing if title wrapped to multiple lines
        if (lines.length > 1) {
          y += (lines.length - 1) * 46;
        }
      } else {
        ctx.fillText(field.value, valueX, y);
      }

      y += lineHeight;
    });
  }, [code]);

  const handlePreviewClick = () => {
    if (canvasRef.current) {
      setModalSrc(canvasRef.current.toDataURL("image/jpeg", 0.95));
      setModalOpen(true);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const handleExport = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${code.code}_slate.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.95);
  };

  if (!code) {
    return <div className={styles.slateContainer}>No code data available</div>;
  }

  return (
    <div className={styles.slateContainer}>
      <div className={styles.slateHeader}>
        <h3>Slate Preview</h3>
        <button className={styles.btnExport} onClick={handleExport}>
          Export as JPG
        </button>
      </div>

      <div className={styles.slatePreview} onClick={handlePreviewClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && handlePreviewClick()}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div className={styles.previewHint}>Click to enlarge</div>
      </div>

      <p className={styles.slateNote}>
        Slate dimensions: 1920x1080 (16:9) — Click "Export as JPG" to download
      </p>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Close preview">✕</button>
            <img src={modalSrc} alt="Slate Preview" className={styles.modalImage} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Slate;
