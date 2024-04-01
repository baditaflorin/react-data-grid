export type Comparator = (a: unknown, b: unknown) => number;

export function getUniversalComparator<T>(columnKey: keyof T): Comparator {
  return (a, b) => {
    const aValue = a[columnKey];
    const bValue = b[columnKey];

    // Check for string values
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue);
    }

    // Check for number values
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return aValue - bValue;
    }

    // Check for boolean values
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return aValue === bValue ? 0 : aValue ? -1 : 1;
    }

    // Fallback for any types not explicitly checked (e.g., dates could be compared as strings)
    return 0;
  };
}
