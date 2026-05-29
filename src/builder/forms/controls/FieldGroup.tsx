import type { ReactNode } from "react";

export interface FieldGroupProps {
  legend: string;
  children: ReactNode;
}

export function FieldGroup({ legend, children }: FieldGroupProps) {
  return (
    <fieldset className="col-span-full grid min-w-0 gap-2 rounded-md border border-solid border-border p-3">
      <legend className="px-2 text-2xs font-medium uppercase tracking-wide text-fg-muted">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}
