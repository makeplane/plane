import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TIssueIdentifierBaseProps = {
  projectId: string;
  size?: "xs" | "sm" | "md" | "lg";
  textContainerClassName?: string;
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
  const { projectId, textContainerClassName } = props;
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

  return (
    <div className="flex items-center space-x-2">
      <span className={cn("text-base font-medium text-custom-text-300", textContainerClassName)}>
        {projectIdentifier}-{issueSequenceId}
      </span>
    </div>
  );
});
