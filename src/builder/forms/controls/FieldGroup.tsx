import type { ReactNode } from "react";

const fieldGroupClass =
  "col-span-full grid min-w-0 gap-2 rounded-md border border-solid border-stone-200 p-3";

const legendClass = "px-2 text-2xs font-medium uppercase tracking-wide text-stone-500";

export interface FieldGroupProps {
  legend: string;
  children: ReactNode;
}

export function FieldGroup({ legend, children }: FieldGroupProps) {
  return (
    <fieldset className={fieldGroupClass}>
      <legend className={legendClass}>{legend}</legend>
      {children}
    </fieldset>
  );
}
