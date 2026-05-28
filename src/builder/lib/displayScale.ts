const CSS_PX_PER_INCH = 96;
const MM_PER_INCH = 25.4;

export function mmToPx(mm: number): number {
  return Math.round((mm / MM_PER_INCH) * CSS_PX_PER_INCH);
}
