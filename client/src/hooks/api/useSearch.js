import { useState } from 'react';
import api from '../../services/api.js';

export function useSearch(endpoint, entityName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });

  const search = async (searchTerm, filters, options = {}, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(searchTerm && { search: searchTerm.trim() }),
        ...filters,
        ...options,
        page,
        limit
      };

      const result = await api.get(endpoint, { params });
      setData(result.data || []);
      setMeta(result.meta || { total: 0, page, limit });
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || `Erreur lors de la recherche ${entityName}`;
      setError(msg);
      console.error(`Erreur recherche ${entityName}:`, err);
      return { data: [], meta: { total: 0, page, limit } };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setError(null);
    setMeta({ total: 0, page: 1, limit: 10 });
  };

  return { data, loading, error, meta, search, reset };
}
