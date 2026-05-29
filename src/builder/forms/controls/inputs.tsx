import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldBase =
  "min-w-0 rounded-md border border-solid border-border bg-surface text-fg outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20";

const selectChevron =
  "appearance-none bg-[linear-gradient(45deg,transparent_50%,var(--pdfua-fg-muted)_50%),linear-gradient(135deg,var(--pdfua-fg-muted)_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-no-repeat";

function cx(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("h-8 w-full px-3", fieldBase, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cx("min-h-24 w-full px-3 py-2 font-mono text-xs", fieldBase, className)} {...rest} />
  );
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx("h-8 cursor-pointer pl-3 pr-7", fieldBase, selectChevron, className)} {...rest} />
  );
}

export function Checkbox({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cx("h-3.5 w-3.5 accent-accent", className)} {...rest} />;
}
