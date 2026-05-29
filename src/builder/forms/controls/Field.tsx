import type { ReactNode } from "react";

const fieldLabelClass =
  "grid min-w-0 gap-1 text-2xs font-medium uppercase tracking-wide text-stone-500";

export interface FieldProps {
  label: ReactNode;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className={fieldLabelClass}>
      {label}
      {children}
    </label>
  );
}
