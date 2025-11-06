import { useNavigate } from "react-router";
import styles from "./ISCIList.module.scss";

const ISCIList = ({ codes, onDelete }) => {
  const navigate = useNavigate();
  const getStatusBadgeClass = (status) => {
    const statusKey = `status${status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')}`;
    return `${styles.statusBadge} ${styles[statusKey] || ''}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
          <span>ISCI Code</span>
          <span>Editor</span>
          <span>Brand/Client</span>
          <span>Campaign</span>
          <span>Spot Title</span>
          <span>Length</span>
          <span>Air/Start Date</span>
          <span>Status</span>
        </div>

        {/* Data Rows */}
        {codes.map((code) => (
          <div key={code.id} className={styles.gridRow}>
            <div className={styles.gridItems}>
              <span className={styles.codeCell}>
                <p>{code.code}</p>
                <div className={styles.controls}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => navigate(`/edit/${code.code}`)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className={styles.btnEdit}
                      onClick={() => onDelete(code.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                </div>
              </span>
              <span>{code.assignedEditor || "Unassigned"}</span>
              <span>{code.brand}</span>
              <span>{code.campaignName || "N/A"}</span>
              <span className={styles.spotTitleCell}>{code.spotTitle}</span>
              <span>{code.spotLength ? `${code.spotLength}s` : "N/A"}</span>
              <span>{formatDate(code.airDate)}</span>
              <span>
                <div className={getStatusBadgeClass(code.status)}>
                  {code.status.replace('_', ' ')}
                </div>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ISCIList;
