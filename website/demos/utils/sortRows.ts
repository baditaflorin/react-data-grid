import { useMemo } from 'react';
import { getUniversalComparator } from './universalComparator'; // Adjust the import path as necessary
import type SortColumn from '../../../src';

interface Row {
    id: number;
    title: string;
    client: string;
    linkedin: string;
    country: string;
    contact: string;
    progress: number;
    available: boolean;
  }

export function useSortedRows(rows: Row[], sortColumns: typeof SortColumn[]): Row[] {
  return useMemo(() => {
    if (sortColumns.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getUniversalComparator<Row>(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);
}
