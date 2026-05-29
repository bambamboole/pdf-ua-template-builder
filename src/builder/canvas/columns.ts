const COLUMN_GAP = "0.375rem";
const MIN_WIDTH = 5;
const TOTAL_WIDTH = 100;

export function parseWidths(
  widths: readonly (number | string)[] | null | undefined,
  count: number,
): number[] {
  if (count <= 0) {
    return [];
  }

  if (!widths || widths.length !== count) {
    return equalWidths(count);
  }

  const parsed = widths.map(parseWidth);

  return parsed.every((width) => Number.isFinite(width)) ? parsed : equalWidths(count);
}

export function formatWidths(widths: readonly number[]): string[] {
  return widths.map((width) => `${width}%`);
}

export function gridTemplateForWidths(
  widths: readonly string[] | null | undefined,
  count: number,
): string | null {
  if (!widths) {
    return null;
  }

  const tracks = parseWidths(widths, count).map((width) => `minmax(0, ${width}fr)`);

  return tracks.join(` ${COLUMN_GAP} `);
}

export function setBoundary(
  widths: readonly number[],
  leftIndex: number,
  leftPercent: number,
): number[] {
  const rightIndex = leftIndex + 1;

  if (leftIndex < 0 || rightIndex >= widths.length) {
    return [...widths];
  }

  const pairTotal = widths[leftIndex] + widths[rightIndex];
  const minLeft = Math.min(MIN_WIDTH, pairTotal);
  const maxLeft = Math.max(minLeft, pairTotal - MIN_WIDTH);
  const nextLeft = Math.round(clamp(leftPercent, minLeft, maxLeft));
  const nextWidths = [...widths];

  nextWidths[leftIndex] = nextLeft;
  nextWidths[rightIndex] = pairTotal - nextLeft;

  return nextWidths;
}

export function labelWidthPercent(width: string | null | undefined, fallback = 30): number {
  const parsed = width == null ? Number.NaN : parseWidth(width);
  const value = Number.isFinite(parsed) ? parsed : fallback;

  return Math.round(clamp(value, MIN_WIDTH, TOTAL_WIDTH - MIN_WIDTH));
}

export const NUMBER_COLUMN_RESERVE = 5;

export interface TableColumnTracks {
  tracks: number[];
  data: number[];
}

export function percentWidth(width: string | number | null | undefined): number | null {
  if (width == null) {
    return null;
  }

  const parsed = parseWidth(width);

  return Number.isFinite(parsed) ? parsed : null;
}

export function distribute(count: number, total: number): number[] {
  if (count <= 0) {
    return [];
  }

  const base = Math.floor(total / count);
  const widths = Array.from({ length: count }, () => base);
  widths[count - 1] += total - base * count;

  return widths;
}

export function tableColumnTracks(
  widths: readonly (string | null | undefined)[],
  numberRows: boolean,
): TableColumnTracks {
  const available = numberRows ? TOTAL_WIDTH - NUMBER_COLUMN_RESERVE : TOTAL_WIDTH;
  const parsed = widths.map((width) => percentWidth(width));
  const data =
    widths.length > 0 && parsed.every((value): value is number => value !== null)
      ? parsed
      : distribute(widths.length, available);
  const tracks = numberRows ? [NUMBER_COLUMN_RESERVE, ...data] : [...data];

  return { tracks, data };
}

function equalWidths(count: number): number[] {
  return distribute(count, TOTAL_WIDTH);
}

function parseWidth(width: number | string): number {
  if (typeof width === "number") {
    return width;
  }

  const percentMatch = width.trim().match(/^([+-]?\d+(?:\.\d+)?)%$/);

  return percentMatch ? Number.parseFloat(percentMatch[1] ?? "") : Number.NaN;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
