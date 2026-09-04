import { PageHeader } from "@/components/ui";
import { SessionProbe } from "@/components/shell/SessionProbe";

export default function FieldPage() {
  return (
    <>
      <PageHeader
        eyebrow="Field"
        title="Today's jobs"
        description="Install the surface, photograph it, and the client sees the proof. The job list arrives in Prompt 9."
      />
      <SessionProbe />
    </>
  );
}
