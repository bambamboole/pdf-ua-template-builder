import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "default" | "primary" | "danger" | "ghost";

const base =
  "inline-flex h-8 cursor-pointer items-center rounded-md border border-solid font-medium transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/20";

const variantClass: Record<ButtonVariant, string> = {
  default:
    "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-muted focus-visible:border-accent disabled:bg-surface disabled:text-fg-subtle",
  primary:
    "border-primary bg-primary font-semibold text-on-dark hover:border-primary-strong hover:bg-primary-strong disabled:border-border-strong disabled:bg-surface-muted disabled:text-fg-subtle",
  danger:
    "border-danger bg-danger-soft text-danger hover:border-danger hover:bg-danger hover:text-on-dark",
  ghost:
    "border-transparent bg-transparent text-fg hover:border-border hover:bg-surface-muted focus-visible:border-accent",
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

const addButtonClass =
  "h-7 w-fit cursor-pointer rounded-md border border-dashed border-border-strong bg-transparent px-3 text-2xs text-fg-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

export function AddButton({
  type = "button",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={[addButtonClass, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}
