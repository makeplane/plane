import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// ce imports
import { IProjectAuthWrapper } from "@/ce/layouts/project-wrapper";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// layouts
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane web imports
import { useFlag, useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  // props
  const { workspaceSlug, projectId, children } = props;
  // store hooks
  const {
    isWorkItemTypeEnabledForProject,
    isEpicEnabledForProject,
    fetchAllWorkItemTypePropertiesAndOptions,
    fetchAllEpicPropertiesAndOptions,
  } = useIssueTypes();
  const { fetchWorkflowStates } = useProjectState();
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString());
  const isEpicEnabled = isEpicEnabledForProject(workspaceSlug?.toString(), projectId?.toString());
  const isWorkflowFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), "WORKFLOWS");

  // fetching all work item types and properties
  useSWR(
    workspaceSlug && projectId && isWorkItemTypeEnabled
      ? ["workItemTypesPropertiesAndOptions", workspaceSlug, projectId, isWorkItemTypeEnabled]
      : null,
    workspaceSlug && projectId && isWorkItemTypeEnabled
      ? () => fetchAllWorkItemTypePropertiesAndOptions(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching all epic types and properties
  useSWR(
    workspaceSlug && projectId && isEpicEnabled
      ? ["epicsPropertiesAndOptions", workspaceSlug, projectId, isEpicEnabled]
      : null,
    workspaceSlug && projectId && isEpicEnabled
      ? () => fetchAllEpicPropertiesAndOptions(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetching project level workflow states
  useSWR(
    workspaceSlug && projectId && isWorkflowFeatureFlagEnabled
      ? `PROJECT_WORKFLOWS_${workspaceSlug}_${projectId}`
      : null,
    workspaceSlug && projectId && isWorkflowFeatureFlagEnabled
      ? () => fetchWorkflowStates(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
