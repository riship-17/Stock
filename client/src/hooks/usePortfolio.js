import { useState, useEffect, useCallback } from 'react';
import { getPortfolios, createPortfolio, updatePortfolio, deletePortfolio } from '../api/portfolios';
import { getPortfolioHoldings } from '../api/portfolios';

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPortfolios();
      setPortfolios(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data) => {
    const result = await createPortfolio(data);
    await fetch();
    return result;
  };

  const update = async (id, data) => {
    const result = await updatePortfolio(id, data);
    await fetch();
    return result;
  };

  const remove = async (id) => {
    await deletePortfolio(id);
    await fetch();
  };

  return { portfolios, loading, error, refetch: fetch, create, update, remove };
}

export function usePortfolioHoldings(portfolioId) {
  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!portfolioId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPortfolioHoldings(portfolioId);
      setHoldings(result.data || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { holdings, summary, loading, error, refetch: fetch };
}
