import { useState, useEffect, useCallback } from "react";

/**
 * useFetchData - Custom hook for fetching data from API endpoints
 *
 * This hook eliminates duplicate fetch patterns across components by providing:
 * - Automatic data fetching on mount
 * - Loading state management
 * - Error handling
 * - Manual refetch capability
 * - Optional data filtering/transformation
 *
 * @param {string} endpoint - API endpoint to fetch from (e.g., "/api/brands")
 * @param {object} options - Configuration options
 * @param {function} options.filter - Optional filter function to apply to data
 * @param {function} options.transform - Optional transform function to apply to data
 * @param {any} options.initialValue - Initial value for data (default: [])
 * @param {boolean} options.fetchOnMount - Whether to fetch immediately on mount (default: true)
 * @param {array} options.dependencies - Additional dependencies to trigger refetch (default: [])
 *
 * @returns {object} { data, loading, error, refetch }
 *
 * @example
 * // Simple usage - fetch all brands
 * const { data: brands, loading, refetch } = useFetchData("/api/brands");
 *
 * @example
 * // With filtering - fetch only active brands
 * const { data: brands } = useFetchData("/api/brands", {
 *   filter: (brands) => brands.filter(b => b.active)
 * });
 *
 * @example
 * // Manual fetch control
 * const { data, refetch } = useFetchData("/api/users", {
 *   fetchOnMount: false
 * });
 * // Later: refetch();
 */
const useFetchData = (endpoint, options = {}) => {
  const {
    filter,
    transform,
    initialValue = [],
    fetchOnMount = true,
    dependencies = []
  } = options;

  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result = await response.json();

      // Apply filter if provided
      if (filter && typeof filter === "function") {
        result = filter(result);
      }

      // Apply transform if provided
      if (transform && typeof transform === "function") {
        result = transform(result);
      }

      setData(result);
    } catch (err) {
      console.error(`Error loading data from ${endpoint}:`, err);
      setError(err);
      setData(initialValue); // Reset to initial value on error
    } finally {
      setLoading(false);
    }
  }, [endpoint, filter, transform, initialValue]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

export default useFetchData;
