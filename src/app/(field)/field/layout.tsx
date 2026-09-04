import { Avatar } from "@/components/shell/Avatar";
import { Logo } from "@/components/shell/Logo";
import styles from "@/components/shell/Shell.module.css";
import { IdentityBar } from "@/components/identity/IdentityBar";
import { getSession } from "@/lib/session";

/**
 * Mobile-first. One hand, bright sunlight, a depot forecourt — so the header is
 * carbon for contrast and the primary action lives at the bottom of the
 * viewport, added per-page in Prompt 9.
 */
export default async function FieldLayout({ children }: LayoutProps<"/field">) {
  const session = await getSession();

  return (
    <div className={styles.fieldShell}>
      <IdentityBar />
      <header className={styles.fieldHeader}>
        <Logo reverse width={122} />
        {session ? <Avatar name={session.user.name} /> : null}
      </header>
      <main className={styles.fieldMain}>{children}</main>
    </div>
  );
}
