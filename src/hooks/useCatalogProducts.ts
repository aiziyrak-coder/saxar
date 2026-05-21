import { useCallback, useEffect, useState } from 'react';
import { loadCatalogProducts } from '../utils/catalogProducts';
import type { Product } from '../types';

export function useCatalogProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadCatalogProducts());
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data: data, loading, refresh };
}
