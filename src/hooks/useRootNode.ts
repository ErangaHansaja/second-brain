import { useCallback, useEffect, useState } from 'react';
import { ensureRootNode } from '@/db/repository';
import type { ParsedNode } from '@/types';

export interface UseRootNodeResult {
  rootNode: ParsedNode | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useRootNode(): UseRootNodeResult {
  const [rootNode, setRootNode] = useState<ParsedNode | null>(null);
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
        const node = await ensureRootNode();
        if (!cancelled) {
          setRootNode(node);
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

  return { rootNode, loading, error, refresh };
}
