import Link from "next/link";

import { Avatar } from "@/components/shell/Avatar";
import { Logo } from "@/components/shell/Logo";
import styles from "@/components/shell/Shell.module.css";
import { IdentityBar } from "@/components/identity/IdentityBar";
import { getSession } from "@/lib/session";

const NAV = [{ href: "/portal", label: "Overview" }];

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const session = await getSession();

  return (
    <div className={styles.portalShell}>
      <IdentityBar />
      <header className={styles.portalHeader}>
        <Link href="/portal" aria-label="Island Media Co, portal home">
          <Logo width={174} />
        </Link>
        <nav className={styles.portalNav} aria-label="Portal">
          {NAV.map((item) => (
            <Link key={item.href} className={styles.portalNavLink} href={item.href}>
              {item.label}
            </Link>
          ))}
          {session ? (
            <Avatar name={session.user.name} />
          ) : (
            <p className={styles.signedOut}>No identity selected</p>
          )}
        </nav>
      </header>
      <main className={styles.portalMain}>{children}</main>
    </div>
  );
}
