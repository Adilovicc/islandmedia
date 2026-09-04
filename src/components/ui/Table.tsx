import type { ComponentProps, ReactNode } from "react";

import styles from "./Table.module.css";

export function Table({ children, className, ...rest }: ComponentProps<"table">) {
  return (
    <div className={styles.wrapper}>
      <table className={[styles.table, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className={styles.head}>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, ...rest }: ComponentProps<"tr">) {
  return (
    <tr className={styles.row} {...rest}>
      {children}
    </tr>
  );
}

export function Th({ children, numeric, ...rest }: ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th scope="col" className={numeric ? styles.numeric : undefined} {...rest}>
      {children}
    </th>
  );
}

type TdProps = ComponentProps<"td"> & {
  strong?: boolean;
  muted?: boolean;
  numeric?: boolean;
};

export function Td({ strong, muted, numeric, className, children, ...rest }: TdProps) {
  return (
    <td
      className={[
        styles.cell,
        strong ? styles.strong : null,
        muted ? styles.muted : null,
        numeric ? styles.numeric : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </td>
  );
}
