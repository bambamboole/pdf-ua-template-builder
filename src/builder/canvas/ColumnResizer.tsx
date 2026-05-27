import type { RefObject } from "react";
import { formatWidths, parseWidths, setBoundary } from "./columns";

export interface ColumnResizerProps {
  widths: readonly string[] | null;
  count: number;
  leftIndex: number;
  containerRef: RefObject<HTMLElement | null>;
  onResize: (widths: string[]) => void;
}

export function ColumnResizer({
  widths,
  count,
  leftIndex,
  containerRef,
  onResize,
}: ColumnResizerProps) {
  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>): void {
    const bounds = containerRef.current?.getBoundingClientRect();

    if (!bounds || bounds.width <= 0) {
      return;
    }

    const containerBounds = bounds;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const parsedWidths = parseWidths(widths, count);
    const pairStart = parsedWidths.slice(0, leftIndex).reduce((total, width) => total + width, 0);

    function handlePointerMove(pointerEvent: PointerEvent): void {
      const pointerPercent =
        ((pointerEvent.clientX - containerBounds.left) / containerBounds.width) * 100;
      const leftPercent = pointerPercent - pairStart;

      onResize(formatWidths(setBoundary(parsedWidths, leftIndex, leftPercent)));
    }

    function handlePointerUp(): void {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <button
      type="button"
      className="column-resizer"
      aria-label={`Resize columns ${leftIndex + 1} and ${leftIndex + 2}`}
      onPointerDown={handlePointerDown}
    />
  );
}
