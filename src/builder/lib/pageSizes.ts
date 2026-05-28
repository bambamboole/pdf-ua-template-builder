import type { Orientation, PageFormat } from "../../types/generated/template";

export const PAGE_SIZES_MM: Record<PageFormat, [number, number]> = {
  A3: [297, 420],
  A4: [210, 297],
  A5: [148, 210],
  A6: [105, 148],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
};

export function pageSizeForFormat(
  format: PageFormat | string | undefined,
  orientation: Orientation | string | undefined = "portrait",
): [number, number] {
  const portraitSize = PAGE_SIZES_MM[(format ?? "A4") as PageFormat] ?? PAGE_SIZES_MM.A4;

  return orientation === "landscape" ? [portraitSize[1], portraitSize[0]] : portraitSize;
}
