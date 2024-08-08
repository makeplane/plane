import { IssueIdentifier as BaseIssueIdentifier } from "ce/components/issues/issue-details/issue-identifier";

import { observer } from "mobx-react";
// ui
import { LayersIcon, Loader, Logo } from "@plane/ui";
// hooks
import { cn } from "@/helpers/common.helper";
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web hooks
import { useIssueType } from "@/plane-web/hooks/store";

type TIssueIdentifierProps = {
  issueId: string;
  projectId: string;
  iconContainerClassName?: string;
  iconSize?: number;
  textContainerClassName?: string;
};

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { issueId, projectId, iconContainerClassName = "", iconSize = 12, textContainerClassName = "" } = props;
  // store hooks
  const { getProjectById, getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const projectDetails = getProjectById(projectId);
  // plane web hooks
  const issueType = useIssueType(issue?.type_id);

  if (!projectDetails?.is_issue_type_enabled) {
    return <BaseIssueIdentifier issueId={issueId} projectId={projectId} />;
  }

  if (!issueType) {
    return (
      <Loader className="flex w-full h-5">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );
  }

  if (issueType?.is_default) {
    return (
      <div className="flex flex-shrink-0 items-center space-x-2">
        <div
          className={cn("flex-shrink-0 grid h-5 w-5 place-items-center rounded bg-[#6695FF]", iconContainerClassName)}
        >
          <LayersIcon width={iconSize} height={iconSize} className="text-white" />
        </div>
        <span className={cn("text-base font-medium text-custom-text-300", textContainerClassName)}>
          {projectDetails?.identifier}-{issue?.sequence_id}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center space-x-2">
      <div
        className={cn(
          "flex-shrink-0 grid h-5 w-5 place-items-center rounded bg-custom-background-80",
          iconContainerClassName
        )}
      >
        {issueType?.logo_props?.in_use ? (
          <Logo logo={issueType.logo_props} size={iconSize} type="lucide" />
        ) : (
            <LayersIcon width={iconSize} height={iconSize} className="text-custom-text-300" />
        )}
      </div>
      <span className={cn("text-base font-medium text-custom-text-300", textContainerClassName)}>
        {getProjectIdentifierById(issue?.project_id)}-{issue?.sequence_id}
      </span>
    </div>
  );
});
