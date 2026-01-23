import { useState } from "react";
import { useNavigate } from "react-router";
import { isAdmin } from "@/utils/auth";
import styles from "./ISCIList.module.scss";

const ISCIList = ({ codes, onDelete }) => {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    if (dateString === "TBD") return "TBD";
    const parsed = Date.parse(dateString);
    if (Number.isNaN(parsed)) return "N/A";
    return new Date(parsed).toLocaleDateString();
  };

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
        case "campaign":
          aValue = a.campaignName || "";
          bValue = b.campaignName || "";
          break;
        case "jobNumber":
          aValue = a.jobNumber || "";
          bValue = b.jobNumber || "";
          break;
        case "spotTitle":
          aValue = a.spotTitle;
          bValue = b.spotTitle;
          break;
        case "length":
          aValue = a.spotLength || 0;
          bValue = b.spotLength || 0;
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
    <div className={styles.isciList}>
      <div className={styles.gridContainer}>
        {/* Header Row */}
        <div className={styles.gridHeader}>
          <span onClick={() => handleSort("code")} className={styles.sortable}>
            ISCI Code {getSortIndicator("code")}
          </span>
          <span onClick={() => handleSort("brand")} className={styles.sortable}>
            Client {getSortIndicator("brand")}
          </span>
          <span onClick={() => handleSort("campaign")} className={styles.sortable}>
            Campaign {getSortIndicator("campaign")}
          </span>
          <span onClick={() => handleSort("jobNumber")} className={styles.sortable}>
            Job Number {getSortIndicator("jobNumber")}
          </span>
          <span onClick={() => handleSort("spotTitle")} className={styles.sortable}>
            Spot Title {getSortIndicator("spotTitle")}
          </span>
          <span onClick={() => handleSort("length")} className={styles.sortable}>
            Length {getSortIndicator("length")}
          </span>
          <span onClick={() => handleSort("airDate")} className={styles.sortable}>
            Air/Start Date {getSortIndicator("airDate")}
          </span>
        </div>

        {/* Data Rows */}
        {sortData(codes).map((code) => (
          <div key={code.id} className={styles.gridRow}>
            <div className={styles.gridItems}>
              <span className={styles.codeCell}>
                <p>{code.code}</p>
                <div className={styles.controls}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => navigate(`/edit/${code.code}`)}
                      title={userIsAdmin ? "Edit" : "View"}
                    >
                      {userIsAdmin ? "Edit" : "View"}
                    </button>
                    {userIsAdmin && (
                      <button
                        className={styles.btnEdit}
                        onClick={() => onDelete(code.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    )}
                </div>
              </span>
              <span>{code.brand}</span>
              <span>{code.campaignName || "N/A"}</span>
              <span>{code.jobNumber || "N/A"}</span>
              <span className={styles.spotTitleCell}>{code.spotTitle}</span>
              <span>{code.spotLength ? `${code.spotLength}s` : "N/A"}</span>
              <span>{formatDate(code.airDate)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ISCIList;
