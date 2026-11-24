import { useCallback, useEffect, useState } from 'react';
import { getChildren } from '@/db/repository';
import type { ParsedNode } from '@/types';

export interface UseChildrenResult {
  children: ParsedNode[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useChildren(parentId: string | null): UseChildrenResult {
  const [children, setChildren] = useState<ParsedNode[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(parentId));
  const [error, setError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const currentParentId = parentId;
    if (!currentParentId) {
      setChildren([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load(targetParentId: string) {
      setLoading(true);
      setError(null);
      try {
        const result = await getChildren(targetParentId);
        if (!cancelled) {
          setChildren(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    load(currentParentId);

    return () => {
      cancelled = true;
    };
  }, [parentId, refreshTick]);

  return { children, loading, error, refresh };
}
