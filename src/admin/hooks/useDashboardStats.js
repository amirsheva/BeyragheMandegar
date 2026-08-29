import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboardStats,
} from "../api/dashboardApi";


export default function useDashboardStats() {
  const [
    stats,
    setStats,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const refresh =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await getDashboardStats();

          setStats(
            data || {}
          );

        } catch (err) {
          setError(
            err.message
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    refresh();
  }, [
    refresh,
  ]);


  return {
    stats,
    loading,
    error,
    refresh,
  };
}
