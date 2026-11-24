import { useCallback, useEffect, useState } from 'react';
import { getAncestors } from '@/db/repository';
import type { BreadcrumbItem } from '@/types';

export interface UseAncestorsResult {
  ancestors: BreadcrumbItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAncestors(nodeId: string | null): UseAncestorsResult {
  const [ancestors, setAncestors] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(nodeId));
  const [error, setError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const currentNodeId = nodeId;
    if (!currentNodeId) {
      setAncestors([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load(targetNodeId: string) {
      setLoading(true);
      setError(null);
      try {
        const rawAncestors = await getAncestors(targetNodeId);
        if (!cancelled) {
          const breadcrumbs: BreadcrumbItem[] = rawAncestors.map((item) => ({
            id: item.id,
            title: item.title,
            depth: item.depth,
          }));
          setAncestors(breadcrumbs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    load(currentNodeId);

    return () => {
      cancelled = true;
    };
  }, [nodeId, refreshTick]);

  return { ancestors, loading, error, refresh };
}
