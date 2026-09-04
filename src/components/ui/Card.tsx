import type { ComponentProps, ReactNode } from "react";

import styles from "./Card.module.css";

type CardProps = ComponentProps<"div"> & {
  /** `flush` clips its children — use it for tables and images. */
  padding?: "default" | "tight" | "flush";
  raised?: boolean;
  feature?: boolean;
  children: ReactNode;
};

export function Card({
  padding = "default",
  raised = false,
  feature = false,
  className,
  children,
  ...rest
}: CardProps) {
  const padded = { default: styles.padded, tight: styles.tight, flush: styles.flush }[padding];
  return (
    <div
      className={[styles.card, padded, raised ? styles.raised : null, feature ? styles.feature : null, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className={styles.title}>{children}</h3>;
}

export function CardBody({ children }: { children: ReactNode }) {
  return <p className={styles.body}>{children}</p>;
}
