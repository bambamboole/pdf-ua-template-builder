import type { ReactNode } from "react";

export interface FieldProps {
  label: ReactNode;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-1 text-2xs font-medium uppercase tracking-wide text-fg-muted">
      {label}
      {children}
    </label>
  );
}
