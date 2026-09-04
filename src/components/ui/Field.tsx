import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";

import styles from "./Field.module.css";

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Receives the ids to wire the control up for assistive technology. */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

/**
 * Label + control + error, wired together. The error is announced rather than
 * only coloured — colour alone is not a message.
 */
export function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? <span className={styles.required} aria-hidden="true">*</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ label, hint, error, required, className, ...rest }: FieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={[styles.control, invalid ? styles.invalid : null, className].filter(Boolean).join(" ")}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

type TextAreaProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextArea({ label, hint, error, required, className, ...rest }: TextAreaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={[styles.control, styles.textarea, invalid ? styles.invalid : null, className]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export { styles as fieldStyles };
