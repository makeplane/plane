import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// layouts
import { IProjectAuthWrapper } from "@/ce/layouts/project-wrapper";
import { ProjectAuthWrapper as CoreProjectAuthWrapper } from "@/layouts/auth-layout";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectAuthWrapper: FC<IProjectAuthWrapper> = observer((props) => {
  // props
  const { children } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { isIssueTypeOrEpicEnabledForProject, fetchAllPropertiesAndOptions } = useIssueTypes();
  // derived values
  const isIssueTypeEnabled = isIssueTypeOrEpicEnabledForProject(
    workspaceSlug?.toString(),
    projectId?.toString(),
    "ISSUE_TYPE_DISPLAY",
    "EPICS_DISPLAY"
  );

  // fetching all issue types and properties
  useSWR(
    workspaceSlug && projectId && isIssueTypeEnabled
      ? `ISSUE_TYPES_AND_PROPERTIES_${workspaceSlug}_${projectId}_${isIssueTypeEnabled}`
      : null,
    workspaceSlug && projectId && isIssueTypeEnabled
      ? () => fetchAllPropertiesAndOptions(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return <CoreProjectAuthWrapper>{children}</CoreProjectAuthWrapper>;
});
