import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// layouts
import { IProjectAuthWrapper } from "@/ce/layouts/project-wrapper";
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  // props
  const { workspaceSlug, projectId, children } = props;
  // store hooks
  const { isIssueTypeEnabledForProject, isEpicEnabledForProject, fetchAllPropertiesAndOptions } = useIssueTypes();
  // derived values
  const isIssueTypeEnabled = isIssueTypeEnabledForProject(
    workspaceSlug?.toString(),
    projectId?.toString(),
    "ISSUE_TYPES"
  );
  const isEpicEnabled = isEpicEnabledForProject(workspaceSlug?.toString(), projectId?.toString(), "EPICS");

  // fetching all issue types and properties
  useSWR(
    workspaceSlug && projectId && (isIssueTypeEnabled || isEpicEnabled)
      ? `ISSUE_TYPES_AND_PROPERTIES_${workspaceSlug}_${projectId}_${isIssueTypeEnabled}_${isEpicEnabled}`
      : null,
    workspaceSlug && projectId && (isIssueTypeEnabled || isEpicEnabled)
      ? () => fetchAllPropertiesAndOptions(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
