import { useEffect, useState } from "react";
import { fetchShows } from "../lib/showsApi";

export default function useShows() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShows()
      .then(setShows)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { shows, loading, error };
}
