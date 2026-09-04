import { PageHeader } from "@/components/ui";
import { SessionProbe } from "@/components/shell/SessionProbe";

export default function PortalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Client portal"
        title="Your campaigns"
        description="Browse surfaces, request a window, accept a contract and see photographic proof that your campaign went up. Browsing arrives in Prompt 5."
      />
      <SessionProbe />
    </>
  );
}
