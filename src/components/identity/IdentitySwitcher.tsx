"use client";

import { useRef } from "react";

import { setIdentity } from "@/lib/actions/identity";
import type { SelectGroup } from "@/components/ui";

import styles from "./IdentityBar.module.css";

/**
 * One global switcher, grouped by role.
 *
 * Submitting on change is a convenience, not the mechanism: the form posts to a
 * server action and works without JavaScript, which is why the submit button
 * exists rather than an onChange-only handler.
 */
export function IdentitySwitcher({
  groups,
  currentUserId,
}: {
  groups: SelectGroup[];
  currentUserId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setIdentity} className={styles.form}>
      <label className={styles.label} htmlFor="identity-switcher">
        Viewing as
      </label>
      <select
        id="identity-switcher"
        name="userId"
        className={styles.select}
        defaultValue={currentUserId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="" disabled>
          Choose a user…
        </option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button type="submit" className={styles.submit}>
        Switch
      </button>
    </form>
  );
}
