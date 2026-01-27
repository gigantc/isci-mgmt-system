import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/**
 * useExportData - Custom hook for handling data export with filtering
 *
 * This hook provides a complete interface for:
 * - Filter state management
 * - Data filtering based on multiple criteria
 * - CSV generation and download
 * - Filter reset functionality
 *
 * @param {array} data - The data to export
 * @param {object} options - Configuration options
 * @param {object} options.initialFilters - Initial filter values
 * @param {function} options.filterFunction - Custom filter function
 * @param {array} options.csvHeaders - CSV column headers
 * @param {function} options.csvRowMapper - Function to map data item to CSV row
 * @param {string} options.filenamePrefix - Prefix for exported filename
 *
 * @returns {object} Export state and methods
 *
 * @example
 * const {
 *   filters,
 *   filteredData,
 *   filteredCount,
 *   handleFilterChange,
 *   resetFilters,
 *   exportToCSV
 * } = useExportData(codes, {
 *   initialFilters: { status: "all", brand: "all" },
 *   filterFunction: (codes, filters) => codes.filter(c => ...),
 *   csvHeaders: ["Code", "Client", "Status"],
 *   csvRowMapper: (code) => [code.code, code.brand, code.status],
 *   filenamePrefix: "isci-codes"
 * });
 */
const useExportData = (data = [], options = {}) => {
  const {
    initialFilters = {},
    filterFunction,
    csvHeaders = [],
    csvRowMapper,
    filenamePrefix = "export"
  } = options;

  const [filters, setFilters] = useState(initialFilters);

  const initialFiltersRef = useRef(initialFilters);
  const filterFunctionRef = useRef(filterFunction);
  const csvRowMapperRef = useRef(csvRowMapper);

  useEffect(() => {
    initialFiltersRef.current = initialFilters;
  }, [initialFilters]);

  useEffect(() => {
    filterFunctionRef.current = filterFunction;
  }, [filterFunction]);

  useEffect(() => {
    csvRowMapperRef.current = csvRowMapper;
  }, [csvRowMapper]);

  /**
   * Handle filter input changes
   */
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Update a specific filter value directly
   */
  const setFilter = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Reset all filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current);
  }, []);

  /**
   * Get filtered data based on current filters
   */
  const filteredData = useMemo(() => {
    const filterFn = filterFunctionRef.current;
    if (!filterFn || typeof filterFn !== "function") {
      return data;
    }

    return filterFn(data, filters);
  }, [data, filters]);

  /**
   * Get count of filtered items
   */
  const filteredCount = useMemo(() => {
    return filteredData.length;
  }, [filteredData]);

  /**
   * Generate CSV content from data
   */
  const generateCSV = useCallback((dataToExport = filteredData) => {
    const rowMapper = csvRowMapperRef.current;
    if (!rowMapper || typeof rowMapper !== "function") {
      throw new Error("csvRowMapper function is required for CSV generation");
    }

    // Convert data to CSV rows
    const rows = dataToExport.map(item => rowMapper(item));

    // Escape and quote fields
    const escapeField = (field) => {
      const str = String(field ?? "");
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(","),
      ...rows.map(row => row.map(escapeField).join(","))
    ].join("\n");

    return csvContent;
  }, [filteredData, csvHeaders]);

  /**
   * Export filtered data to CSV file
   */
  const exportToCSV = useCallback((customData = null, customFilename = null) => {
    const dataToExport = customData || filteredData;

    if (dataToExport.length === 0) {
      alert("No data to export with current filters");
      return false;
    }

    try {
      const csvContent = generateCSV(dataToExport);

      // Create download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = customFilename ||
        `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Error exporting data. Please try again.");
      return false;
    }
  }, [filteredData, generateCSV, filenamePrefix]);

  /**
   * Download a CSV template with example data
   */
  const downloadTemplate = useCallback((exampleRow = null) => {
    if (!csvHeaders || csvHeaders.length === 0) {
      console.error("CSV headers are required for template download");
      return false;
    }

    let csvContent;

    if (exampleRow && Array.isArray(exampleRow)) {
      // Include example row
      const escapeField = (field) => {
        const str = String(field ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return `"${str}"`;
      };

      csvContent = [
        csvHeaders.join(","),
        exampleRow.map(escapeField).join(",")
      ].join("\n");
    } else {
      // Headers only
      csvContent = csvHeaders.join(",");
    }

    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filenamePrefix}-template.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error downloading template:", error);
      return false;
    }
  }, [csvHeaders, filenamePrefix]);

  return {
    // Filter state
    filters,
    setFilters,

    // Filtered data
    filteredData,
    filteredCount,

    // Methods
    handleFilterChange,
    setFilter,
    resetFilters,
    exportToCSV,
    downloadTemplate,
    generateCSV
  };
};

export default useExportData;
