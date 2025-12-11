import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api.js';

export default function useFiscalSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/settings/fiscal');
      if (res?.success === true) {
        setData(res.data);
      } else {
        setError(res?.message || 'Erreur lors du chargement des paramètres fiscaux');
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remaining = data?.counter?.remaining ?? null;
  const warningInfo = data?.warningInfo ?? null;

  return { loading, error, data, remaining, warningInfo, refresh };
}
