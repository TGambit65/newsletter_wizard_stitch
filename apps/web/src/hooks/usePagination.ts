import { useState, useMemo, useEffect } from 'react';

interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  paginatedItems: T[];
  hasNext: boolean;
  hasPrev: boolean;
  /** Total item count (convenience alias for items.length) */
  totalItems: number;
}

/**
 * Client-side pagination over an array of items.
 * Automatically resets to page 1 when the items array reference changes.
 */
export function usePagination<T>(items: T[], pageSize = 20): UsePaginationResult<T> {
  const [page, setPageRaw] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when item list changes (e.g. after filtering)
  useEffect(() => {
    setPageRaw(1);
  }, [items]);

  const setPage = (newPage: number) => {
    setPageRaw(Math.min(Math.max(1, newPage), totalPages));
  };

  const paginatedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    totalItems: items.length,
  };
}
