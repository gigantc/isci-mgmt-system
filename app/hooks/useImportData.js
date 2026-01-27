import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useImportData - Custom hook for handling CSV file imports
 *
 * This hook provides a complete interface for:
 * - File upload handling
 * - File preview generation
 * - CSV import with different modes (add/update/replace)
 * - Import result handling
 * - Progress state management
 *
 * @param {object} options - Configuration options
 * @param {string} options.endpoint - API endpoint for import (e.g., "/api/isci/import")
 * @param {string} options.defaultMode - Default import mode ("add" | "update" | "replace")
 * @param {function} options.onSuccess - Callback function on successful import
 * @param {function} options.onError - Callback function on import error
 *
 * @returns {object} Import state and methods
 *
 * @example
 * const {
 *   file,
 *   preview,
 *   result,
 *   mode,
 *   isImporting,
 *   handleFileUpload,
 *   handleImport,
 *   setMode,
 *   clearFile,
 *   clearResult
 * } = useImportData({
 *   endpoint: "/api/isci/import",
 *   defaultMode: "add",
 *   onSuccess: (result) => {
 *     console.log("Import successful", result);
 *     loadData();
 *   }
 * });
 */
const useImportData = (options = {}) => {
  const {
    endpoint,
    defaultMode = "add",
    onSuccess,
    onError
  } = options;

  const [file, setFile] = useState(null);
  const [mode, setMode] = useState(defaultMode);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Handle file upload and preview generation
   */
  const handleFileUpload = useCallback((e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Validate file type
    if (!uploadedFile.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setFile(uploadedFile);
    setResult(null);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target.result;
        const lines = csvData.trim().split("\n");

        setPreview({
          rowCount: lines.length - 1, // Subtract header row
          fileName: uploadedFile.name,
          fileSize: (uploadedFile.size / 1024).toFixed(2) + " KB",
          headers: lines[0] ? lines[0].split(",").map(h => h.replace(/"/g, "").trim()) : []
        });
      } catch (error) {
        console.error("Error previewing file:", error);
        alert("Error reading file. Please ensure it's a valid CSV.");
        setFile(null);
        setPreview(null);
      }
    };
    reader.onerror = () => {
      alert("Error reading file. Please try again.");
      setFile(null);
      setPreview(null);
    };
    reader.readAsText(uploadedFile);
  }, []);

  /**
   * Handle file upload via drag & drop
   */
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    // Create synthetic event object for handleFileUpload
    const syntheticEvent = {
      target: {
        files: [droppedFile]
      }
    };

    handleFileUpload(syntheticEvent);
  }, [handleFileUpload]);

  /**
   * Clear uploaded file and preview
   */
  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
  }, []);

  /**
   * Clear import result
   */
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  /**
   * Perform import operation
   */
  const handleImport = useCallback(async () => {
    if (!file) {
      alert("Please select a file to import");
      return false;
    }

    if (!endpoint) {
      console.error("Import endpoint is required");
      return false;
    }

    setIsImporting(true);
    setResult(null);

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const csvData = event.target.result;

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ csvData, importMode: mode })
          });

          const importResult = await response.json();
          setResult(importResult);

          if (importResult.success) {
            const successHandler = onSuccessRef.current;
            if (successHandler && typeof successHandler === "function") {
              successHandler(importResult);
            }

            // Clear file after successful import
            setFile(null);
            setPreview(null);

            resolve(true);
          } else {
            const errorHandler = onErrorRef.current;
            if (errorHandler && typeof errorHandler === "function") {
              errorHandler(importResult);
            }

            resolve(false);
          }
        } catch (error) {
          console.error("Import error:", error);
          const errorResult = {
            success: false,
            message: "Import failed: " + error.message
          };
          setResult(errorResult);

          const errorHandler = onErrorRef.current;
          if (errorHandler && typeof errorHandler === "function") {
            errorHandler(errorResult);
          }

          resolve(false);
        } finally {
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        const errorResult = {
          success: false,
          message: "Error reading file. Please try again."
        };
        setResult(errorResult);
        setIsImporting(false);

        const errorHandler = onErrorRef.current;
        if (errorHandler && typeof errorHandler === "function") {
          errorHandler(errorResult);
        }

        resolve(false);
      };

      reader.readAsText(file);
    });
  }, [file, endpoint, mode]);

  /**
   * Read file contents without importing (for custom processing)
   */
  const readFile = useCallback(() => {
    if (!file) return Promise.reject(new Error("No file selected"));

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        resolve(event.target.result);
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsText(file);
    });
  }, [file]);

  return {
    // State
    file,
    preview,
    result,
    mode,
    isImporting,

    // Methods
    handleFileUpload,
    handleFileDrop,
    handleImport,
    setMode,
    clearFile,
    clearResult,
    readFile,

    // Direct setters (use with caution)
    setFile,
    setPreview,
    setResult
  };
};

export default useImportData;
