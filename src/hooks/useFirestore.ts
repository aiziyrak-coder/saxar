import { useState, useEffect, useCallback, useMemo } from 'react';

/** Firestore olib tashlangan — bo‘sh ro‘yxat qaytaradi. */
export type FirestoreQueryConstraint = { __firestoreConstraint?: true };

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

export function useFirestore<T extends { id?: string }>(
  _collectionName: string,
  _constraints?: FirestoreQueryConstraint[]
): UseFirestoreReturn<T> {
  const empty = useMemo(() => [] as T[], []);

  const fetchData = useCallback(async () => {
    /* Django API sahifalarida alohida yuklanadi */
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [state] = useState<UseFirestoreState<T>>({
    data: empty,
    loading: false,
    error: null,
  });

  return {
    ...state,
    refresh: fetchData,
    create: async () => null,
    update: async () => false,
    remove: async () => false,
  };
}

export function useFirestoreDoc<T extends { id?: string }>(
  _collectionName: string,
  docId: string | null
) {
  const [state] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchDoc = useCallback(async () => {
    if (!docId) return;
  }, [docId]);

  useEffect(() => {
    void fetchDoc();
  }, [fetchDoc]);

  return {
    ...state,
    refresh: fetchDoc,
    update: async () => false,
  };
}
