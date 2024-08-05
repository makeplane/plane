import { observer } from "mobx-react";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";

type TIssueIdentifierProps = {
  issueId: string;
  projectId: string;
};

export const IssueIdentifier: React.FC<TIssueIdentifierProps> = observer((props) => {
  const { issueId, projectId } = props;
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
      <span className="text-base font-medium text-custom-text-300">
        {projectDetails?.identifier}-{issue?.sequence_id}
      </span>
    </div>
  );
});
