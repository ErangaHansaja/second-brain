import { useCallback, useEffect, useState } from 'react';
import { getAllNodes } from '@/db/repository';
import type { ParsedNode } from '@/types';

export interface UseAllNodesResult {
  nodes: ParsedNode[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAllNodes(): UseAllNodesResult {
  const [nodes, setNodes] = useState<ParsedNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getAllNodes();
        if (!cancelled) {
          setNodes(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return { nodes, loading, error, refresh };
}
