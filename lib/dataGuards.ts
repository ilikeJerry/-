export function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function hasItems<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}
