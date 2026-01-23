import { useRef, useEffect } from "react";
import styles from "./Slate.module.scss";

const Slate = ({ code }) => {
  const canvasRef = useRef(null);

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
    return `:${length}`;
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
      { label: "Client:", value: code.brand || "N/A" },
      { label: "Title:", value: fullTitle },
      { label: "ISCI:", value: code.code || "N/A" },
      { label: "LENGTH:", value: formatLength(code.spotLength) },
      { label: "AUDIO:", value: code.audio || "STEREO LR" },
      { label: "AGENCY:", value: code.agency || "N/A" },
      { label: "DATE:", value: formatDate(code.airDate) }
    ];

    // Starting position - more centered
    let y = 200;
    const lineHeight = 100;
    const labelX = 240;
    const valueX = 600;
    const maxWidth = 1680; // Maximum width for text (1920 - 240 margin)

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
      ctx.font = "bold 48px Inter, sans-serif";
      ctx.fillText(field.label, labelX, y);

      // Value - special handling for Title field
      ctx.font = "400 48px Inter, sans-serif";

      if (field.label === "Title:") {
        // Wrap title if it's too long
        const availableWidth = maxWidth - valueX;
        const lines = wrapText(field.value, availableWidth);

        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, valueX, y + (lineIndex * 60));
        });

        // Add extra spacing if title wrapped to multiple lines
        if (lines.length > 1) {
          y += (lines.length - 1) * 60;
        }
      } else {
        ctx.fillText(field.value, valueX, y);
      }

      y += lineHeight;
    });
  }, [code]);

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

      <div className={styles.slatePreview}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <p className={styles.slateNote}>
        Slate dimensions: 1920x1080 (16:9) - Click "Export as JPG" to download
      </p>
    </div>
  );
};

export default Slate;
