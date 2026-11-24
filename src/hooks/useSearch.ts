import { useCallback, useEffect, useRef, useState } from 'react';
import { searchNodes } from '@/db/repository';
import type { SearchResult } from '@/types';

export interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  results: SearchResult[];
  loading: boolean;
  error: Error | null;
}

export function useSearch(debounceMs = 250): UseSearchResult {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const requestIdRef = useRef<number>(0);

  const clearQuery = useCallback(() => {
    requestIdRef.current += 1;
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const currentRequestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const searchHits = await searchNodes(trimmed);
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
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return {
    query,
    setQuery,
    clearQuery,
    results,
    loading,
    error,
  };
}
