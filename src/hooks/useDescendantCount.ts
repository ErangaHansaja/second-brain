import { useCallback, useEffect, useState } from 'react';
import { getDescendantCount } from '@/db/repository';

export interface UseDescendantCountResult {
  count: number;
  loading: boolean;
  refresh: () => void;
}

export function useDescendantCount(
  nodeId: string | null,
  refreshKey?: number
): UseDescendantCountResult {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(Boolean(nodeId));
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const currentNodeId = nodeId;
    if (!currentNodeId) {
      setCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load(targetNodeId: string) {
      setLoading(true);
      try {
        const result = await getDescendantCount(targetNodeId);
        if (!cancelled) {
          setCount(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCount(0);
          setLoading(false);
        }
      }
    }

    load(currentNodeId);

    return () => {
      cancelled = true;
    };
  }, [nodeId, refreshKey, refreshTick]);

  return { count, loading, refresh };
}
