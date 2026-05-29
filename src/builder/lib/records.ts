export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function omitKey<TValue>(
  record: Record<string, TValue>,
  key: string,
): Record<string, TValue> {
  if (!(key in record)) {
    return record;
  }

  const next = { ...record };
  delete next[key];
  return next;
}

export function renameKey<TValue>(
  record: Record<string, TValue>,
  previousKey: string,
  nextKey: string,
): Record<string, TValue> {
  if (!(previousKey in record)) {
    return record;
  }

  const next: Record<string, TValue> = {};
  for (const [key, value] of Object.entries(record)) {
    next[key === previousKey ? nextKey : key] = value;
  }
  return next;
}
