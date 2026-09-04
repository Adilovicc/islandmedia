import styles from "./StatusPill.module.css";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

/**
 * Domain state -> brand tone.
 *
 * Every status the app can show is listed here, so a pill can never fall back
 * to a default that quietly misreports a failed job as neutral. The tones come
 * from the brand kit's .im-status-* rules:
 *
 *   success  the thing is done or firm      CONFIRMED, COMPLETED, ACTIVE
 *   info     in flight, awaiting someone    ISSUED, BOOKED, ASSIGNED
 *   warning  provisional, needs a decision  DRAFT, HELD, SCHEDULED, PENDING
 *   danger   it failed or is gone           CANCELLED, FAILED, UNAVAILABLE
 *   neutral  ended without incident         RELEASED, DROPPED, WITHDRAWN
 */
const TONE_FOR_STATUS: Record<string, StatusTone> = {
  // Contract
  DRAFT: "warning",
  ISSUED: "info",
  CONFIRMED: "success",
  ACTIVE: "success",
  COMPLETED: "success",
  CANCELLED: "danger",

  // Contract line
  HELD: "warning",
  BOOKED: "info",
  RELEASED: "neutral",

  // Job
  SCHEDULED: "warning",
  ASSIGNED: "info",
  IN_PROGRESS: "info",
  FAILED: "danger",

  // Booking request
  SUBMITTED: "info",
  REVIEWING: "warning",
  CONVERTED: "success",
  PARTIALLY_CONVERTED: "warning",
  DECLINED: "danger",
  WITHDRAWN: "neutral",

  // Booking request item
  PENDING: "warning",
  UNAVAILABLE: "danger",
  DROPPED: "neutral",

  // Derived availability, shown on browse
  AVAILABLE: "success",
};

/** "IN_PROGRESS" -> "In progress". Sentence case, per the copy rules. */
function humanise(status: string): string {
  const words = status.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function toneForStatus(status: string): StatusTone {
  return TONE_FOR_STATUS[status] ?? "neutral";
}

export function StatusPill({
  status,
  label,
  tone,
}: {
  status: string;
  /** Override when the domain word is not the word a reader needs. */
  label?: string;
  tone?: StatusTone;
}) {
  const resolved = tone ?? toneForStatus(status);
  return (
    <span className={[styles.pill, styles[resolved]].join(" ")}>
      {label ?? humanise(status)}
    </span>
  );
}
