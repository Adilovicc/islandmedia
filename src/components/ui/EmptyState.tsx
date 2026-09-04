import type { ReactNode } from "react";

import styles from "./EmptyState.module.css";

/**
 * An empty state says what to do next, never "No data". If there is nothing to
 * show, the screen still has a job: tell the reader how to make something
 * appear, and who can do it.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
