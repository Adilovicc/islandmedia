import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { SelectGroup } from "@/components/ui";

import { IdentitySwitcher } from "./IdentitySwitcher";
import styles from "./IdentityBar.module.css";

const GROUP_LABEL = {
  ADMIN: "Agency staff",
  FITTER: "Field crew",
  CLIENT: "Advertisers",
} as const;

const ROLE_ORDER = ["ADMIN", "FITTER", "CLIENT"] as const;

/**
 * The demo bar, rendered in all three areas.
 *
 * It lists every user because the point is to walk one story across three
 * audiences without touching the URL bar. Client users carry their client name,
 * since two of them share a tenancy and the whole tenancy demonstration falls
 * apart if you cannot tell which is which.
 */
export async function IdentityBar() {
  const [session, users] = await Promise.all([
    getSession(),
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        client: { select: { tradingName: true, name: true } },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  const groups: SelectGroup[] = ROLE_ORDER.map((role) => ({
    label: GROUP_LABEL[role],
    options: users
      .filter((user) => user.role === role)
      .map((user) => ({
        value: user.id,
        label: user.client
          ? `${user.name} — ${user.client.tradingName ?? user.client.name}`
          : user.name,
      })),
  })).filter((group) => group.options.length > 0);

  return (
    <div className={styles.bar}>
      <span className={styles.tag}>Demo</span>
      <p className={styles.explain}>
        Authentication is simulated. Switch identity to follow one campaign
        across the client, the agency and the fitter.
      </p>
      {session ? (
        <span className={styles.current}>
          <span className={styles.currentName}>{session.user.name}</span>
          {session.clientName ? ` · ${session.clientName}` : ` · ${GROUP_LABEL[session.role]}`}
        </span>
      ) : null}
      <IdentitySwitcher groups={groups} currentUserId={session?.user.id ?? null} />
    </div>
  );
}
