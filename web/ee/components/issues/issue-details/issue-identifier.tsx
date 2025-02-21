import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EWorkItemTypeEntity } from "@plane/constants";
import { Loader, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// ce components
import {
  IssueIdentifier as BaseIssueIdentifier,
  TIssueIdentifierProps,
} from "@/ce/components/issues/issue-details/issue-identifier";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// plane web components
import { IssueTypeLogo } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

type TIdentifierTextProps = {
  identifier: string;
  enableClickToCopyIdentifier?: boolean;
  textContainerClassName?: string;
};

export const IdentifierText: React.FC<TIdentifierTextProps> = (props) => {
  const { identifier, enableClickToCopyIdentifier = false, textContainerClassName } = props;
  // handlers
  const handleCopyIssueIdentifier = () => {
    if (enableClickToCopyIdentifier) {
      navigator.clipboard.writeText(identifier).then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Work item ID copied to clipboard",
        });
      });
    }
  };

  return (
    <Tooltip tooltipContent="Click to copy" disabled={!enableClickToCopyIdentifier} position="top">
      <span
        className={cn(
          "text-base font-medium text-custom-text-300",
          {
            "cursor-pointer": enableClickToCopyIdentifier,
          },
          textContainerClassName
        )}
        onClick={handleCopyIssueIdentifier}
      >
        {identifier}
      </span>
    </Tooltip>
  );
};

type TIssueTypeIdentifier = {
  issueTypeId: string;
  size?: "xs" | "sm" | "md" | "lg";
};

export const IssueTypeIdentifier: FC<TIssueTypeIdentifier> = observer((props) => {
  const { issueTypeId, size = "sm" } = props;
  // hooks
  const issueType = useIssueType(issueTypeId);

  return (
    <Tooltip tooltipContent={issueType?.name} disabled={!issueType?.name} position="top-left">
      <div className="flex flex-shrink-0">
        <IssueTypeLogo
          icon_props={issueType?.logo_props?.icon}
          size={size}
          isDefault={issueType?.is_default}
          isEpic={issueType?.is_epic}
        />
      </div>
    </Tooltip>
  );
});

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const {
    projectId,
    size = "sm",
    textContainerClassName = "",
    displayProperties,
    enableClickToCopyIdentifier = false,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { loader: issueTypesLoader, isWorkItemTypeEntityEnabledForProject } = useIssueTypes();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const issueType = useIssueType(issueTypeId);
  const isWorkItemTypeEntityEnabled = isWorkItemTypeEntityEnabledForProject(
    workspaceSlug?.toString(),
    projectId,
    issueType?.is_epic ? EWorkItemTypeEntity.EPIC : EWorkItemTypeEntity.WORK_ITEM
  );
  const shouldRenderIssueTypeIcon = displayProperties ? displayProperties.issue_type : true;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!isWorkItemTypeEntityEnabled) {
    const baseProps = {
      projectId,
      size,
      textContainerClassName,
      displayProperties,
      enableClickToCopyIdentifier,
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
    <div className={cn("flex flex-shrink-0 items-center", size === "xs" ? "space-x-1" : "space-x-2")}>
      {shouldRenderIssueTypeIcon && issueTypeId && <IssueTypeIdentifier issueTypeId={issueTypeId} size={size} />}
      {shouldRenderIssueID && (
        <IdentifierText
          identifier={`${projectIdentifier}-${issueSequenceId}`}
          enableClickToCopyIdentifier={enableClickToCopyIdentifier}
          textContainerClassName={textContainerClassName}
        />
      )}
    </div>
  );
});
