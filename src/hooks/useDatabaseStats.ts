import { useCallback, useEffect, useState } from 'react';
import { getDatabaseStats } from '@/db/repository';
import type { DatabaseStats } from '@/types';

export interface UseDatabaseStatsResult {
  stats: DatabaseStats | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useDatabaseStats(): UseDatabaseStatsResult {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
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
        const result = await getDatabaseStats();
        if (!cancelled) {
          setStats(result);
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

  return { stats, loading, error, refresh };
}
