import { IssueIdentifier as BaseIssueIdentifier } from "ce/components/issues/issue-details/issue-identifier";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { IIssueDisplayProperties } from "@plane/types";
// ui
import { Loader, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web components
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

type TIssueIdentifierBaseProps = {
  projectId: string;
  size?: "sm" | "md" | "lg";
  textContainerClassName?: string;
  displayProperties?: IIssueDisplayProperties | undefined;
};

type TIssueIdentifierFromStore = TIssueIdentifierBaseProps & {
  issueId: string;
};

type TIssueIdentifierWithDetails = TIssueIdentifierBaseProps & {
  issueTypeId?: string | null;
  projectIdentifier: string;
  issueSequenceId: string | number;
};

type TIssueIdentifierProps = TIssueIdentifierFromStore | TIssueIdentifierWithDetails;

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { projectId, size = "sm", textContainerClassName = "", displayProperties } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { loader: issueTypesLoader, isIssueTypeEnabledForProject } = useIssueTypes();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const issueType = useIssueType(issueTypeId);
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const isIssueTypeDisplayEnabled = isIssueTypeEnabledForProject(
    workspaceSlug?.toString(),
    projectId,
    "ISSUE_TYPE_DISPLAY"
  );
  const shouldRenderIssueTypeIcon = displayProperties ? displayProperties.issue_type : true;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!isIssueTypeDisplayEnabled) {
    const baseProps = {
      projectId,
      size,
      textContainerClassName,
      displayProperties,
    };
    const identifierProps = isUsingStoreData
      ? { issueId: props.issueId }
      : {
          issueTypeId: props.issueTypeId,
          projectIdentifier: props.projectIdentifier,
          issueSequenceId: props.issueSequenceId,
        };
    return <BaseIssueIdentifier {...baseProps} {...identifierProps} />;
  }

  if (!shouldRenderIssueTypeIcon && !shouldRenderIssueID) return null;

  if (issueTypesLoader === "init-loader") {
    return (
      <Loader className="flex flex-shrink-0 w-20 h-5">
        <Loader.Item height="100%" width="100%" />
      </Loader>
    );
  }

  return (
    <Tooltip tooltipContent={issueType?.name} disabled={!issueType?.name} position="top-left">
      <div className="flex flex-shrink-0 items-center space-x-2">
        {shouldRenderIssueTypeIcon && (
          <IssueTypeLogo icon_props={issueType?.logo_props?.icon} size={size} isDefault={issueType?.is_default} />
        )}
        {shouldRenderIssueID && (
          <span className={cn("text-base font-medium text-custom-text-300", textContainerClassName)}>
            {projectIdentifier}-{issueSequenceId}
          </span>
        )}
      </div>
    </Tooltip>
  );
});
