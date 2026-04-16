import { useState, useEffect, useCallback, useMemo } from 'react';
import type { QueryConstraint, DocumentData } from 'firebase/firestore';
import { FirestoreService } from '../services/firestore';

interface UseFirestoreState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

interface UseFirestoreReturn<T> extends UseFirestoreState<T> {
  refresh: () => Promise<void>;
  create: (data: Omit<T, 'id'>) => Promise<string | null>;
  update: (id: string, data: Partial<T>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useFirestore<T extends DocumentData>(
  collectionName: string,
  constraints?: QueryConstraint[]
): UseFirestoreReturn<T> {
  const [state, setState] = useState<UseFirestoreState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const service = useMemo(() => new FirestoreService<T>(collectionName), [collectionName]);

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let items: T[];
      if (constraints && constraints.length > 0) {
        items = await service.query(constraints);
      } else {
        items = await service.getAll();
      }
      
      setState({ data: items, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setState({
        data: [],
        loading: false,
        error: errorMessage,
      });
    }
  }, [service, constraints]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (data: Omit<T, 'id'>): Promise<string | null> => {
    try {
      const id = await service.create(data);
      await fetchData();
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [service, fetchData]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    try {
      await service.update(id, data);
      await fetchData();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [service, fetchData]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await service.delete(id);
      await fetchData();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [service, fetchData]);

  return {
    ...state,
    refresh: fetchData,
    create,
    update,
    remove,
  };
}

// Hook for single document
export function useFirestoreDoc<T extends DocumentData>(
  collectionName: string,
  docId: string | null
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: !!docId,
    error: null,
  });

  const service = useMemo(() => new FirestoreService<T>(collectionName), [collectionName]);

  const fetchDoc = useCallback(async () => {
    if (!docId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const doc = await service.getById(docId);
      setState({ data: doc, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch document';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [service, docId]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const update = useCallback(async (data: Partial<T>): Promise<boolean> => {
    if (!docId) return false;
    try {
      await service.update(docId, data);
      await fetchDoc();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, [docId, service, fetchDoc]);

  return {
    ...state,
    refresh: fetchDoc,
    update,
  };
}
