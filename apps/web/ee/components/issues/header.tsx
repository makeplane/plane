import { useParams } from "next/navigation";
import { IssuesHeader as CeIssueHeader } from "@/ce/components/issues";
import { WithFeatureFlagHOC } from "../feature-flags";
import { AdvancedIssuesHeader } from "./advanced-header";

export const IssuesHeader = () => {
  const { workspaceSlug } = useParams();
  return (
    // Add CE component for fallback
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PROJECT_OVERVIEW" fallback={<CeIssueHeader />}>
      <AdvancedIssuesHeader />
    </WithFeatureFlagHOC>
  );
};
