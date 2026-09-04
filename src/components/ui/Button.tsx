import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type CommonProps = {
  variant?: ButtonVariant;
  /** Compact height, for toolbars and table rows. Never for a field primary. */
  size?: "default" | "small";
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps> & { href: string };

function classesFor({ variant = "primary", size = "default", fullWidth, className }: CommonProps) {
  return [
    styles.button,
    styles[variant],
    size === "small" ? styles.small : null,
    fullWidth ? styles.fullWidth : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * A button says what happens. "Issue contract", not "Submit".
 *
 * Renders an anchor when given `href`, so navigation stays a link — right-click
 * and open-in-new-tab keep working, which they do not for a button that calls
 * router.push.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.href !== undefined) {
    const { variant, size, fullWidth, className, children, ...rest } = props;
    return (
      <Link className={classesFor({ variant, size, fullWidth, className, children })} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant, size, fullWidth, className, children, type, ...rest } = props;
  return (
    <button
      type={type ?? "button"}
      className={classesFor({ variant, size, fullWidth, className, children })}
      {...rest}
    >
      {children}
    </button>
  );
}
