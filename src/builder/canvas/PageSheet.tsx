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
  const style = { "--page-width": `${mmToPx(widthMm)}px` } as CSSProperties;

  return (
    <div className="builder-page-sheet" style={style}>
      <div className="builder-page-sheet__meta">
        <span>
          {format} · {orientation}
        </span>
        <span>{Math.round(widthMm)}mm</span>
      </div>
      {children}
    </div>
  );
}
