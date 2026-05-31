import { forwardRef, type KeyboardEvent, type ReactNode } from "react";

export interface InspectorShellProps {
  ariaLabel: string;
  className?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  children: ReactNode;
}

export const InspectorShell = forwardRef<HTMLElement, InspectorShellProps>(function InspectorShell(
  { ariaLabel, className, onKeyDown, children },
  ref,
) {
  return (
    <aside
      ref={ref}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={`grid min-h-0 min-w-0 content-start gap-4 overflow-x-hidden overflow-y-auto bg-surface p-4 outline-none${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      {children}
    </aside>
  );
});

export interface InspectorHeaderProps {
  title: string;
  chip?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}

export function InspectorHeader({ title, chip, subtitle, action }: InspectorHeaderProps) {
  return (
    <header className="flex min-w-0 items-start justify-between gap-2">
      <div className="flex min-w-0 flex-auto items-start gap-2">
        {chip}
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-fg">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 mb-0 break-words text-xs text-fg-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

export function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 gap-2 overflow-hidden rounded-md border border-solid border-border bg-surface-muted p-3">
      <legend className="px-1 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
