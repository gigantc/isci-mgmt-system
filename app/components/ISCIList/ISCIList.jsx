import { useState } from "react";
import { useNavigate } from "react-router";
import { isAdmin, canEdit } from "@/utils/auth";
import { colorForCode } from "@/utils/palette";
import { formatAirDateSlash } from "@/utils/dates";
import styles from "./ISCIList.module.scss";

const ISCIList = ({ codes, onDelete, density = "comfy", selectedIndex = -1 }) => {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  const userCanEdit = canEdit();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const formatDate = formatAirDateSlash;

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortData = (data) => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case "code":
          aValue = a.code;
          bValue = b.code;
          break;
        case "brand":
          aValue = a.brand;
          bValue = b.brand;
          break;
        case "spotTitle":
          aValue = a.spotTitle;
          bValue = b.spotTitle;
          break;
        case "length":
          aValue = a.spotLength || 0;
          bValue = b.spotLength || 0;
          break;
        case "channel":
          aValue = a.placement?.name || "";
          bValue = b.placement?.name || "";
          break;
        case "airDate": {
          const toSortableDate = (value) => {
            if (!value || value === "TBD") return 0;
            const parsed = Date.parse(value);
            return Number.isNaN(parsed) ? 0 : parsed;
          };
          aValue = toSortableDate(a.airDate);
          bValue = toSortableDate(b.airDate);
          break;
        }
        default:
          return 0;
      }

      // Handle numeric comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle string comparison (case-insensitive)
      const comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const getSortIndicator = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? "▲" : "▼";
  };

  if (codes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No ISCI codes found. Create your first one to get started!</p>
      </div>
    );
  }

  return (
    <div className={`${styles.isciList} ${density === "compact" ? styles.compact : ""}`}>
      <div className={styles.gridContainer}>
        {/* Header Row */}
        <div className={styles.gridHeader}>
          <span onClick={() => handleSort("code")} className={styles.sortable}>
            ISCI code {getSortIndicator("code")}
          </span>
          <span onClick={() => handleSort("brand")} className={styles.sortable}>
            Client {getSortIndicator("brand")}
          </span>
          <span onClick={() => handleSort("spotTitle")} className={styles.sortable}>
            Spot title {getSortIndicator("spotTitle")}
          </span>
          <span onClick={() => handleSort("length")} className={`${styles.sortable} ${styles.numHeader}`}>
            Length {getSortIndicator("length")}
          </span>
          <span onClick={() => handleSort("channel")} className={styles.sortable}>
            Placement {getSortIndicator("channel")}
          </span>
          <span onClick={() => handleSort("airDate")} className={styles.sortable}>
            Air date {getSortIndicator("airDate")}
          </span>
          <span />
        </div>

        {/* Data Rows */}
        {sortData(codes).map((code, idx) => (
          <div
            key={code.id}
            className={`${styles.gridRow} ${idx === selectedIndex ? styles.selected : ""}`}
            onClick={() => navigate(`/isci/${code.code}`)}
          >
            <div className={styles.gridItems}>
              <span className={`${styles.twoLine} ${styles.codeCell}`}>
                {code.code}
                {code.jobNumber && <small>{code.jobNumber}</small>}
              </span>
              <span className={styles.clientCell}>
                <span className={styles.clientDot} style={{ background: code.brandColor || colorForCode(code.brandCode || code.brand) }} />
                {code.brand}
              </span>
              <span className={`${styles.twoLine} ${styles.spotTitleCell}`}>
                {code.spotTitle}
                {code.campaignName && <small>{code.campaignName}</small>}
              </span>
              <span className={styles.numCell}>{code.spotLength ? `${code.spotLength}s` : "—"}</span>
              <span>
                {code.placement?.name ? <span className={styles.pill}>{code.placement.name}</span> : "—"}
              </span>
              <span>{formatDate(code.airDate)}</span>
              <span className={styles.actionsCell}>
                {userCanEdit && (
                  <button
                    type="button"
                    className={styles.rowAction}
                    onClick={(e) => { e.stopPropagation(); navigate(`/edit/${code.code}`); }}
                    title="Edit"
                  >
                    ✎
                  </button>
                )}
                {userIsAdmin && (
                  <button
                    type="button"
                    className={`${styles.rowAction} ${styles.rowActionDanger}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(code.id); }}
                    title="Delete"
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ISCIList;
