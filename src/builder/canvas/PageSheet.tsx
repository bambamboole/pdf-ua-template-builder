import type { CSSProperties, ReactNode } from "react";
import type { Orientation, PageFormat } from "../../types/generated/template";
import { mmToPx } from "../lib/displayScale";
import { pageSizeForFormat } from "../lib/pageSizes";

export interface PageSheetProps {
  format: PageFormat;
  orientation: Orientation;
  children: ReactNode;
  /** Show the "{format} · {orientation} / {width}mm" caption. Off for the footer sheet. */
  showMeta?: boolean;
}

export function PageSheet({ format, orientation, children, showMeta = true }: PageSheetProps) {
  const [widthMm] = pageSizeForFormat(format, orientation);
  const style: CSSProperties = { maxWidth: `${mmToPx(widthMm)}px` };

  return (
    <div
      // The page mirrors the white PDF the backend renders, so it stays light
      // even in dark mode (the surrounding canvas/chrome still go dark).
      data-theme="light"
      className="mx-auto grid w-full gap-3 rounded-xl border border-solid border-border bg-page p-6 shadow-page transition-[max-width] duration-200"
      style={style}
    >
      {showMeta ? (
        <div className="mb-2 flex items-center justify-between text-2xs uppercase tracking-[0.06em] text-fg-subtle">
          <span>
            {format} · {orientation}
          </span>
          <span>{Math.round(widthMm)}mm</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}
