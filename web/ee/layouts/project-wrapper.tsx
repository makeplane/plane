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
  const {
    isWorkItemTypeEnabledForProject,
    isEpicEnabledForProject,
    fetchAllWorkItemTypePropertiesAndOptions,
    fetchAllEpicPropertiesAndOptions,
  } = useIssueTypes();
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString());
  const isEpicEnabled = isEpicEnabledForProject(workspaceSlug?.toString(), projectId?.toString());

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

  return (
    <CoreProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      {children}
    </CoreProjectAuthWrapper>
  );
});
