import Link from "next/link";

import { Avatar } from "@/components/shell/Avatar";
import { Logo } from "@/components/shell/Logo";
import styles from "@/components/shell/Shell.module.css";
import { IdentityBar } from "@/components/identity/IdentityBar";
import { getSession } from "@/lib/session";

// Grows as later prompts add pages. Only routes that exist are listed — a nav
// item that 404s is worse than a nav item that is not there yet.
const NAV = [{ href: "/management", label: "Overview" }];

export default async function ManagementLayout({ children }: LayoutProps<"/management">) {
  const session = await getSession();

  return (
    <div className={styles.managementShell}>
      <IdentityBar />
      <div className={styles.managementBody}>
        <aside className={styles.sidebar}>
          <Logo reverse width={174} />
          <nav className={styles.nav} aria-label="Management">
            {NAV.map((item) => (
              <Link key={item.href} className={styles.navLink} href={item.href}>
                <span className={styles.navGlyph} aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.account}>
            {session ? (
              <>
                <Avatar name={session.user.name} />
                <div>
                  <span className={styles.accountName}>{session.user.name}</span>
                  <span className={styles.accountRole}>Agency manager</span>
                </div>
              </>
            ) : (
              <span className={styles.accountRole}>No identity selected</span>
            )}
          </div>
        </aside>
        <main className={styles.managementMain}>{children}</main>
      </div>
    </div>
  );
}
