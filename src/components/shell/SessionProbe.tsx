import { Card, CardTitle, EmptyState } from "@/components/ui";
import { getSession } from "@/lib/session";

import styles from "./SessionProbe.module.css";

/**
 * Proof that identity is resolved on the SERVER.
 *
 * Everything here is read inside a server component via getSession(), which
 * reads the signed cookie and then looks the user up in the database. Nothing
 * is passed in as a prop and nothing is held in React state — switch identity
 * and these values change because the server returned different ones.
 */
export async function SessionProbe() {
  const session = await getSession();

  // The prompt asks for the session user to be logged in a server component.
  // This line runs in the Node process, never in the browser.
  console.log("[session]", session ? `${session.user.name} (${session.role}) clientId=${session.clientId ?? "—"}` : "no identity");

  if (!session) {
    return (
      <EmptyState
        title="No identity selected"
        description="Pick a user from the demo switcher above to see what the server returns for them."
      />
    );
  }

  return (
    <Card>
      <CardTitle>What the server resolved</CardTitle>
      <dl className={styles.grid}>
        <div>
          <dt className={styles.term}>User</dt>
          <dd className={styles.value}>{session.user.name}</dd>
        </div>
        <div>
          <dt className={styles.term}>Role</dt>
          <dd className={styles.value}>{session.role}</dd>
        </div>
        <div>
          <dt className={styles.term}>Client</dt>
          <dd className={[styles.value, session.clientName ? null : styles.none].filter(Boolean).join(" ")}>
            {session.clientName ?? "Not a client user"}
          </dd>
        </div>
        <div>
          <dt className={styles.term}>Client id</dt>
          <dd className={[styles.value, session.clientId ? null : styles.none].filter(Boolean).join(" ")}>
            {session.clientId ?? "—"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
