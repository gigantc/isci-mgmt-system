import "./ISCIList.scss";

const ISCIList = ({ codes, onEdit, onDelete }) => {
  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status.replace('_', '-')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (codes.length === 0) {
    return (
      <div className="empty-state">
        <p>No ISCI codes found. Create your first one to get started!</p>
      </div>
    );
  }

  return (
    <div className="isci-list">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ISCI Code</th>
              <th>Editor</th>
              <th>Brand/Client</th>
              <th>Campaign</th>
              <th>Spot Title</th>
              <th>Length</th>
              <th>Language</th>
              <th>CC</th>
              <th>Audio</th>
              <th>Air Date</th>
              <th>Ratio</th>
              <th>Ver</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td className="code-cell">{code.code}</td>
                <td>{code.assignedEditor || "Unassigned"}</td>
                <td>{code.brand}</td>
                <td>{code.campaignName || "N/A"}</td>
                <td className="spot-title-cell">{code.spotTitle}</td>
                <td>{code.spotLength ? `${code.spotLength}s` : "N/A"}</td>
                <td>{code.language || "N/A"}</td>
                <td>{code.closedCaptioning || "N/A"}</td>
                <td>{code.audio || "N/A"}</td>
                <td>{formatDate(code.airDate)}</td>
                <td>{code.aspectRatio || "N/A"}</td>
                <td>{code.version || "N/A"}</td>
                <td>{code.channel || "N/A"}</td>
                <td>
                  <span className={getStatusBadgeClass(code.status)}>
                    {code.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-edit"
                    onClick={() => onEdit(code)}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(code.id)}
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ISCIList;
