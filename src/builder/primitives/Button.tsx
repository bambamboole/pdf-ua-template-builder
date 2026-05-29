import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "default" | "primary" | "danger" | "ghost";

const base =
  "inline-flex h-8 cursor-pointer items-center rounded-md border border-solid font-medium transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-indigo-600/20";

const variantClass: Record<ButtonVariant, string> = {
  default:
    "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-100 focus-visible:border-indigo-600 disabled:bg-white disabled:text-stone-400",
  primary:
    "border-stone-800 bg-stone-800 font-semibold text-white hover:border-stone-950 hover:bg-stone-950 disabled:border-stone-300 disabled:bg-stone-100 disabled:text-stone-400",
  danger:
    "border-red-700 bg-red-50 text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white",
  ghost:
    "border-transparent bg-transparent text-stone-900 hover:border-stone-200 hover:bg-stone-100 focus-visible:border-indigo-600",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Render as a square icon button (no label padding). */
  icon?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "default",
  icon = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const layout = icon ? "w-8 justify-center p-0" : "gap-2 whitespace-nowrap px-3";
  const classes = [base, layout, variantClass[variant], className].filter(Boolean).join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
