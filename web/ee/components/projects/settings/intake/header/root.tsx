import { useParams } from "next/navigation";
import { ProjectInboxHeader as CeHeader } from "@/ce/components/projects/settings/intake";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { IntakeHeader } from "./header";

export const ProjectInboxHeader = () => {
  const { workspaceSlug } = useParams();
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="INTAKE_SETTINGS" fallback={<CeHeader />}>
      <IntakeHeader />
    </WithFeatureFlagHOC>
  );
};
