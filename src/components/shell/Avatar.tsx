import styles from "./Shell.module.css";

/** Initials, as in all three mockups. */
export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <span className={styles.avatar} aria-hidden="true">
      {initials}
    </span>
  );
}
