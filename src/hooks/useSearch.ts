import { useCallback, useEffect, useRef, useState } from 'react';
import { searchNodes } from '@/db/repository';
import type { SearchFilters, SearchResult } from '@/types';

export interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  refresh: () => void;
  results: SearchResult[];
  loading: boolean;
  error: Error | null;
}

export function useSearch(
  debounceMs = 250,
  filters?: SearchFilters
): UseSearchResult {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const requestIdRef = useRef<number>(0);

  const filterNodeType = filters?.nodeType;
  const filterStatus = filters?.status?.trim() || undefined;

  const clearQuery = useCallback(() => {
    requestIdRef.current += 1;
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  const refresh = useCallback(() => {
    setRefreshTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const hasQuery = trimmed.length > 0;

    if (!hasQuery && !filterStatus) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const currentRequestId = ++requestIdRef.current;
    const delay = hasQuery ? debounceMs : 0;

    const timer = setTimeout(async () => {
      try {
        const searchHits = await searchNodes(trimmed, {
          nodeType: filterNodeType,
          status: filterStatus,
        });
        if (requestIdRef.current === currentRequestId) {
          setResults(searchHits);
          setLoading(false);
        }
      } catch (err) {
        if (requestIdRef.current === currentRequestId) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs, filterNodeType, filterStatus, refreshTick]);

  return {
    query,
    setQuery,
    clearQuery,
    refresh,
    results,
    loading,
    error,
  };
}
