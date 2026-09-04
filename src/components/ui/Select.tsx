import type { ComponentProps, ReactNode } from "react";

import { FieldShell, fieldStyles as styles } from "./Field";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectGroup = { label: string; options: SelectOption[] };

type SelectProps = Omit<ComponentProps<"select">, "id" | "children"> & {
  label: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
  /** Grouped options render as <optgroup> — used by the identity switcher. */
  groups?: SelectGroup[];
  placeholder?: string;
  children?: ReactNode;
};

export function Select({
  label,
  hint,
  error,
  options,
  groups,
  placeholder,
  required,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={[styles.control, invalid ? styles.invalid : null, className].filter(Boolean).join(" ")}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {groups?.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
          {children}
        </select>
      )}
    </FieldShell>
  );
}
