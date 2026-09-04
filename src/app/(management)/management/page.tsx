import { PageHeader } from "@/components/ui";
import { SessionProbe } from "@/components/shell/SessionProbe";

export default function ManagementPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations overview"
        title="Management"
        description="Build inventory, convert requests into contracts, issue documents and dispatch fitters. The map and inventory editor arrive in Prompt 4."
      />
      <SessionProbe />
    </>
  );
}
