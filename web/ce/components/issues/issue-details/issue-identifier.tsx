import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TIssueIdentifierProps = {
  issueId: string;
  projectId: string;
  iconSize?: number;
  iconContainerSize?: number;
  textContainerClassName?: string;
};

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { issueId, projectId, textContainerClassName } = props;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const projectDetails = getProjectById(projectId);

  return (
    <div className="flex items-center space-x-2">
      <span className={cn("text-xs font-medium text-custom-text-300", textContainerClassName)}>
        {projectDetails?.identifier}-{issue?.sequence_id}
      </span>
    </div>
  );
});
