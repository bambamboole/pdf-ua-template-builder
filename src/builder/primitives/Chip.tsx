import type { ReactNode } from "react";

export interface ChipProps {
  children: ReactNode;
  /** Grow to fit multi-character labels instead of staying a 22×22 square. */
  wide?: boolean;
}

export function Chip({ children, wide = false }: ChipProps) {
  return (
    <span
      className={`inline-grid h-[22px] place-items-center rounded bg-surface-muted font-mono text-2xs font-semibold text-fg-muted ${wide ? "min-w-[22px] px-1" : "w-[22px]"}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
