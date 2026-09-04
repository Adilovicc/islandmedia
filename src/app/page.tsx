import Link from "next/link";

import styles from "./placeholder.module.css";

// Placeholder index. The branded landing page is Prompt 12, and is first on the
// cut list — this exists so the three areas are reachable during the build.
export default function IndexPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Island Media Co</p>
      <h1 className={styles.title}>Out-of-home booking and fulfilment</h1>
      <p className={styles.lede}>
        The agency sells advertising surfaces for periods of time. Clients
        request, management contracts, fitters install and photograph, clients
        see the proof.
      </p>
      <ul className={styles.links}>
        <li>
          <Link className={styles.link} href="/portal">
            Client portal
          </Link>
        </li>
        <li>
          <Link className={styles.link} href="/management">
            Management
          </Link>
        </li>
        <li>
          <Link className={styles.link} href="/field">
            Field
          </Link>
        </li>
      </ul>
    </main>
  );
}
