import { useState, useEffect, useCallback } from 'react';
import { getStockQuote, getStockHistory, compareStocks } from '../api/stocks';

export function useStockQuote(ticker) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getStockQuote(ticker);
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useStockHistory(ticker, range = '1M') {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getStockHistory(ticker, range);
      setData(result.data);
      setStats(result.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticker, range]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, stats, loading, error, refetch: fetch };
}

export function useCompareStocks(tickers, range = '1M') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!tickers || tickers.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await compareStocks(tickers, range);
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(tickers), range]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
