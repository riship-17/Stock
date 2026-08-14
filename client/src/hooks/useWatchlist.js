import { useState, useEffect, useCallback } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, convertWatchlistToBuy } from '../api/watchlist';

export function useWatchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWatchlist();
      setItems(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (data) => {
    const result = await addToWatchlist(data);
    await fetch();
    return result;
  };

  const remove = async (id) => {
    await removeFromWatchlist(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  const convertToBuy = async (id, data) => {
    const result = await convertWatchlistToBuy(id, data);
    await fetch();
    return result;
  };

  return { items, loading, error, refetch: fetch, add, remove, convertToBuy };
}
