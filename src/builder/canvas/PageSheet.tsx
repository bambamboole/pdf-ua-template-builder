import type { CSSProperties, ReactNode } from "react";
import type { Orientation, PageFormat } from "../../types/generated/template";
import { mmToPx } from "../lib/displayScale";
import { pageSizeForFormat } from "../lib/pageSizes";

export interface PageSheetProps {
  format: PageFormat;
  orientation: Orientation;
  children: ReactNode;
}

export function PageSheet({ format, orientation, children }: PageSheetProps) {
  const [widthMm] = pageSizeForFormat(format, orientation);
  const style: CSSProperties = { maxWidth: `${mmToPx(widthMm)}px` };

  return (
    <div
      className="mx-auto grid w-full gap-3 rounded-xl border border-solid border-stone-200 bg-white p-6 shadow-page transition-[max-width] duration-200"
      style={style}
    >
      <div className="mb-2 flex items-center justify-between text-2xs uppercase tracking-[0.06em] text-stone-400">
        <span>
          {format} · {orientation}
        </span>
        <span>{Math.round(widthMm)}mm</span>
      </div>
      {children}
    </div>
  );
}
