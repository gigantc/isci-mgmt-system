import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthenticated, isAdmin } from "@/utils/auth";
import styles from "./Reports.module.scss";

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("export");
  const [codes, setCodes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState("add");
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    dateType: "all",
    startDate: "",
    endDate: "",
    status: "all",
    assignedEditor: "all",
    brand: "all",
    channel: "all",
    spotLength: "all"
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else if (!isAdmin()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [codesRes, brandsRes, usersRes] = await Promise.all([
        fetch("/api/isci"),
        fetch("/api/brands"),
        fetch("/api/users")
      ]);

      const [codesData, brandsData, usersData] = await Promise.all([
        codesRes.json(),
        brandsRes.json(),
        usersRes.json()
      ]);

      setCodes(codesData);
      setBrands(brandsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getFilteredCodes = () => {
    return codes.filter(code => {
      // Date filter
      if (filters.dateType !== "all" && filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        let codeDate;

        if (filters.dateType === "created") {
          codeDate = new Date(code.createdAt);
        } else if (filters.dateType === "updated") {
          codeDate = new Date(code.updatedAt);
        } else if (filters.dateType === "air") {
          if (!code.airDate) return false;
          codeDate = new Date(code.airDate);
        }

        if (codeDate < startDate || codeDate > endDate) return false;
      }

      // Status filter
      if (filters.status !== "all" && code.status !== filters.status) {
        return false;
      }

      // Assigned Editor filter
      if (filters.assignedEditor !== "all" && code.assignedEditor !== filters.assignedEditor) {
        return false;
      }

      // Brand filter
      if (filters.brand !== "all" && code.brand !== filters.brand) {
        return false;
      }

      // Channel filter
      if (filters.channel !== "all" && code.channel !== filters.channel) {
        return false;
      }

      // Spot Length filter
      if (filters.spotLength !== "all" && code.spotLength?.toString() !== filters.spotLength) {
        return false;
      }

      return true;
    });
  };

  const exportToCSV = () => {
    const filteredCodes = getFilteredCodes();

    if (filteredCodes.length === 0) {
      alert("No data to export with current filters");
      return;
    }

    // CSV Headers
    const headers = [
      "ISCI Code",
      "Brand",
      "Campaign Name",
      "Spot Title",
      "Spot Length",
      "Assigned Editor",
      "Status",
      "Channel",
      "Aspect Ratio",
      "Version",
      "Language",
      "Closed Captioning",
      "Audio",
      "Air Date",
      "Description",
      "Created At",
      "Updated At"
    ];

    // Convert data to CSV rows
    const rows = filteredCodes.map(code => [
      code.code,
      code.brand,
      code.campaignName || "",
      code.spotTitle,
      code.spotLength || "",
      code.assignedEditor || "",
      code.status,
      code.channel,
      code.aspectRatio,
      code.version,
      code.language,
      code.closedCaptioning,
      code.audio,
      code.airDate || "",
      code.description || "",
      code.createdAt,
      code.updatedAt
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `isci-codes-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilters({
      dateType: "all",
      startDate: "",
      endDate: "",
      status: "all",
      assignedEditor: "all",
      brand: "all",
      channel: "all",
      spotLength: "all"
    });
  };

  const filteredCount = getFilteredCodes().length;

  const downloadTemplate = () => {
    const headers = [
      "ISCI Code",
      "Brand",
      "Campaign Name",
      "Spot Title",
      "Spot Length",
      "Assigned Editor",
      "Status",
      "Channel",
      "Aspect Ratio",
      "Version",
      "Language",
      "Closed Captioning",
      "Audio",
      "Air Date",
      "Description"
    ];

    const exampleRow = [
      "LVCI2599",
      "Las Vegas Convention and Visitors Authority",
      "Summer Campaign",
      "Vegas Summer Spots 30s",
      "30",
      "Sarah Johnson",
      "pending",
      "Broadcast",
      "16:9",
      "A",
      "English",
      "Yes",
      "Stereo LR",
      "2025-06-01",
      "Summer campaign spot"
    ];

    const csvContent = [
      headers.join(","),
      exampleRow.map(field => `"${field}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "isci-import-template.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.trim().split("\n");
      setImportPreview({
        rowCount: lines.length - 1,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + " KB"
      });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;

      try {
        const response = await fetch("/api/isci/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvData, importMode })
        });

        const result = await response.json();
        setImportResult(result);

        if (result.success) {
          // Reload codes
          loadData();
          setImportFile(null);
          setImportPreview(null);
        }
      } catch (error) {
        console.error("Import error:", error);
        setImportResult({ success: false, message: "Import failed: " + error.message });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className={styles.reportsPage}>

      <div className={styles.pageContent}>
        <div className={styles.stickyHeader}>
          <h2>Reports</h2>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "export" ? styles.active : ""}`}
              onClick={() => setActiveTab("export")}
            >
              Export Data
            </button>
            <button
              className={`${styles.tab} ${activeTab === "import" ? styles.active : ""}`}
              onClick={() => setActiveTab("import")}
            >
              Import Data
            </button>
          </div>
        </div>

        <div className={styles.scrollableContent}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading data...</div>
          ) : (
            <>
              {activeTab === "export" && (
                <div className={styles.exportSection}>
                  <div className={styles.filtersCard}>
                    <h3>Filter Data</h3>

                    <div className={styles.filterGrid}>
                      {/* Date Filter */}
                      <div className={styles.filterGroup}>
                        <label>Date Filter</label>
                        <select name="dateType" value={filters.dateType} onChange={handleFilterChange}>
                          <option value="all">All Dates</option>
                          <option value="created">Created Date</option>
                          <option value="updated">Updated Date</option>
                          <option value="air">Air Date</option>
                        </select>
                      </div>

                      {filters.dateType !== "all" && (
                        <>
                          <div className={styles.filterGroup}>
                            <label>Start Date</label>
                            <input
                              type="date"
                              name="startDate"
                              value={filters.startDate}
                              onChange={handleFilterChange}
                            />
                          </div>
                          <div className={styles.filterGroup}>
                            <label>End Date</label>
                            <input
                              type="date"
                              name="endDate"
                              value={filters.endDate}
                              onChange={handleFilterChange}
                            />
                          </div>
                        </>
                      )}

                      {/* Status Filter */}
                      <div className={styles.filterGroup}>
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      {/* Assigned Editor Filter */}
                      <div className={styles.filterGroup}>
                        <label>Assigned Editor</label>
                        <select name="assignedEditor" value={filters.assignedEditor} onChange={handleFilterChange}>
                          <option value="all">All Editors</option>
                          {users.map(user => (
                            <option key={user.id} value={`${user.firstName} ${user.lastName}`}>
                              {user.firstName} {user.lastName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Brand Filter */}
                      <div className={styles.filterGroup}>
                        <label>Brand</label>
                        <select name="brand" value={filters.brand} onChange={handleFilterChange}>
                          <option value="all">All Brands</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Channel Filter */}
                      <div className={styles.filterGroup}>
                        <label>Channel</label>
                        <select name="channel" value={filters.channel} onChange={handleFilterChange}>
                          <option value="all">All Channels</option>
                          <option value="Broadcast">Broadcast</option>
                          <option value="CTV">CTV</option>
                          <option value="Digital">Digital</option>
                          <option value="Social">Social</option>
                          <option value="OLV">OLV</option>
                          <option value="Radio">Radio</option>
                        </select>
                      </div>

                      {/* Spot Length Filter */}
                      <div className={styles.filterGroup}>
                        <label>Spot Length</label>
                        <select name="spotLength" value={filters.spotLength} onChange={handleFilterChange}>
                          <option value="all">All Lengths</option>
                          <option value="6">6 seconds</option>
                          <option value="10">10 seconds</option>
                          <option value="15">15 seconds</option>
                          <option value="30">30 seconds</option>
                          <option value="45">45 seconds</option>
                          <option value="60">60 seconds</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.filterActions}>
                      <button className={styles.btnReset} onClick={resetFilters}>
                        Reset Filters
                      </button>
                    </div>
                  </div>

                  <div className={styles.exportCard}>
                    <div className={styles.exportInfo}>
                      <h3>Export Results</h3>
                      <p className={styles.resultCount}>
                        {filteredCount} of {codes.length} codes will be exported
                      </p>
                    </div>
                    <button
                      className={styles.btnExport}
                      onClick={exportToCSV}
                      disabled={filteredCount === 0}
                    >
                      Export to CSV
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "import" && (
                <div className={styles.importSection}>
                  <div className={styles.importCard}>
                    <h3>Import ISCI Codes from CSV</h3>

                    <div className={styles.templateSection}>
                      <p>Need a template?</p>
                      <button className={styles.btnTemplate} onClick={downloadTemplate}>
                        Download CSV Template
                      </button>
                    </div>

                    <div className={styles.importOptions}>
                      <label>Import Mode:</label>
                      <div className={styles.radioGroup}>
                        <label>
                          <input
                            type="radio"
                            value="add"
                            checked={importMode === "add"}
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          Add new codes only (skip existing)
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="update"
                            checked={importMode === "update"}
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          Update existing codes
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="replace"
                            checked={importMode === "replace"}
                            onChange={(e) => setImportMode(e.target.value)}
                          />
                          Replace all data (⚠️ Warning: deletes all existing codes)
                        </label>
                      </div>
                    </div>

                    <div className={styles.uploadSection}>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        id="csvUpload"
                        className={styles.fileInput}
                      />
                      <label htmlFor="csvUpload" className={styles.uploadLabel}>
                        {importFile ? importFile.name : "Choose CSV file or drag here"}
                      </label>
                    </div>

                    {importPreview && (
                      <div className={styles.previewCard}>
                        <h4>File Preview</h4>
                        <p>File: {importPreview.fileName}</p>
                        <p>Size: {importPreview.fileSize}</p>
                        <p>Rows to import: {importPreview.rowCount}</p>
                      </div>
                    )}

                    {importResult && (
                      <div className={`${styles.resultCard} ${importResult.success ? styles.success : styles.error}`}>
                        <h4>{importResult.success ? "✓ Import Successful" : "✗ Import Failed"}</h4>
                        <p>{importResult.message}</p>
                        {importResult.skipped > 0 && <p>Skipped {importResult.skipped} existing codes</p>}
                        {importResult.errors && (
                          <div className={styles.errorList}>
                            <p>Errors:</p>
                            {importResult.errors.slice(0, 5).map((err, i) => (
                              <p key={i}>Row {err.row}: {err.error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.importActions}>
                      <button
                        className={styles.btnImport}
                        onClick={handleImport}
                        disabled={!importFile || isImporting}
                      >
                        {isImporting ? "Importing..." : "Import CSV"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
