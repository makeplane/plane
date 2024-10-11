import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties } from "@plane/types";
// ui
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TIssueIdentifierBaseProps = {
  projectId: string;
  size?: "xs" | "sm" | "md" | "lg";
  textContainerClassName?: string;
  displayProperties?: IIssueDisplayProperties | undefined;
  enableClickToCopyIdentifier?: boolean;
};

type TIssueIdentifierFromStore = TIssueIdentifierBaseProps & {
  issueId: string;
};

type TIssueIdentifierWithDetails = TIssueIdentifierBaseProps & {
  issueTypeId?: string | null;
  projectIdentifier: string;
  issueSequenceId: string | number;
};

export type TIssueIdentifierProps = TIssueIdentifierFromStore | TIssueIdentifierWithDetails;

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
          title: "Issue ID copied to clipboard",
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

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { projectId, textContainerClassName, displayProperties, enableClickToCopyIdentifier = false } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const shouldRenderIssueID = displayProperties ? displayProperties.key : true;

  if (!shouldRenderIssueID) return null;

  return (
    <div className="flex items-center space-x-2">
      <IdentifierText
        identifier={`${projectIdentifier}-${issueSequenceId}`}
        enableClickToCopyIdentifier={enableClickToCopyIdentifier}
        textContainerClassName={textContainerClassName}
      />
    </div>
  );
});
