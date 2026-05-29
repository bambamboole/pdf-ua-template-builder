import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const focusRing =
  "outline-none transition-colors hover:border-stone-300 focus-visible:border-indigo-600 focus-visible:ring-3 focus-visible:ring-indigo-600/20";

const fieldBase = `min-w-0 rounded-md border border-solid border-stone-200 bg-white text-stone-900 ${focusRing}`;

const selectChevron =
  "appearance-none bg-[linear-gradient(45deg,transparent_50%,#6b6b6b_50%),linear-gradient(135deg,#6b6b6b_50%,transparent_50%)] bg-[length:5px_5px,5px_5px] bg-[position:calc(100%-14px)_50%,calc(100%-9px)_50%] bg-no-repeat";

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
  return <input type="checkbox" className={cx("h-3.5 w-3.5 accent-indigo-600", className)} {...rest} />;
}
