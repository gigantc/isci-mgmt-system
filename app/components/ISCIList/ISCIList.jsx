import "./ISCIList.scss";

/**
 * ISCIList Component
 *
 * This is the "I can see all my stuff at once" component.
 * Displays all ISCI codes in a nice table format with all the juicy details.
 *
 * Props we need:
 *   - codes: Array of ISCI code objects (the goods!)
 *   - onEdit: Function to call when someone wants to change something
 *   - onDelete: Function to call when someone wants to nuke an entry
 */
const ISCIList = ({ codes, onEdit, onDelete }) => {
  /**
   * getStatusBadgeClass
   *
   * Turns status names into pretty CSS class names.
   * "in_progress" becomes "status-in-progress" because CSS doesn't like underscores.
   * (CSS has trust issues with underscores, go figure 🤷)
   */
  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status.replace('_', '-')}`;
  };

  /**
   * formatDate
   *
   * Turns ugly date strings into pretty human-readable dates.
   * "2024-01-15T10:00:00.000Z" → "1/15/2024"
   * If there's no date, we just say "N/A" (aka "¯\\_(ツ)_/¯")
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // If there are no codes, show a friendly "nothing here yet" message
  // Better than staring at an empty table like it owes you money
  if (codes.length === 0) {
    return (
      <div className="empty-state">
        <p>No ISCI codes found. Create your first one to get started!</p>
      </div>
    );
  }

  return (
    <div className="isci-list">
      {/* The main event: a table with all the codes! */}
      <table>
        <thead>
          <tr>
            {/* Column headers - telling people what they're looking at */}
            <th>ISCI Code</th>
            <th>Advertiser</th>
            <th>Title</th>
            <th>Duration</th>
            <th>Assigned Editor</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Loop through each code and make a row for it */}
          {/* .map() is like a for-loop but fancier (and React likes it better) */}
          {codes.map((code) => (
            <tr key={code.id}>
              {/* The ISCI code itself - styled differently to make it stand out */}
              <td className="code-cell">{code.code}</td>

              {/* Who's paying for this commercial? Show me the money! 💰 */}
              <td>{code.advertiser}</td>

              {/* What's this commercial called? */}
              <td>{code.title}</td>

              {/* How long is this thing? Add an "s" for seconds, or "N/A" if nobody told us */}
              <td>{code.duration ? `${code.duration}s` : "N/A"}</td>

              {/* Who's working on this? Or is it just floating in the void? */}
              <td>{code.assignedEditor || "Unassigned"}</td>

              {/* Status badge - color-coded for your viewing pleasure */}
              <td>
                <span className={getStatusBadgeClass(code.status)}>
                  {/* Replace underscores with spaces: in_progress → in progress */}
                  {code.status.replace('_', ' ')}
                </span>
              </td>

              {/* When is this due? (Asking for a stressed-out editor friend) */}
              <td>{formatDate(code.dueDate)}</td>

              {/* Action buttons: Edit or Delete (choose your own adventure!) */}
              <td className="actions-cell">
                {/* Edit button - "I need to change this!" */}
                <button
                  className="btn-edit"
                  onClick={() => onEdit(code)}
                  title="Edit"
                >
                  Edit
                </button>

                {/* Delete button - "This was a mistake, abort mission!" 🗑️ */}
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
  );
};

export default ISCIList;
