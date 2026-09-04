import type { ComponentProps, ReactNode } from "react";

import styles from "./Frame.module.css";

/**
 * The brand's corner-bracket motif. Decorative, so the brackets are drawn with
 * pseudo-elements and are invisible to assistive technology.
 */
export function Frame({
  inset = false,
  className,
  children,
  ...rest
}: ComponentProps<"div"> & { inset?: boolean; children: ReactNode }) {
  return (
    <div
      className={[styles.frame, inset ? styles.inset : null, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
