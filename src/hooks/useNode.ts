import { useCallback, useEffect, useState } from 'react';
import { getNode } from '@/db/repository';
import type { ParsedNode } from '@/types';

export interface UseNodeResult {
  node: ParsedNode | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useNode(id: string | null): UseNodeResult {
  const [node, setNode] = useState<ParsedNode | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const currentId = id;
    if (!currentId) {
      setNode(null);
      setSettledId(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load(targetId: string) {
      setLoading(true);
      setError(null);
      try {
        const result = await getNode(targetId);
        if (!cancelled) {
          setNode(result);
          setSettledId(targetId);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setSettledId(targetId);
          setLoading(false);
        }
      }
    }

    load(currentId);

    return () => {
      cancelled = true;
    };
  }, [id, refreshTick]);

  const isSettled = id === null || settledId === id;
  return { node, loading: loading || !isSettled, error, refresh };
}
