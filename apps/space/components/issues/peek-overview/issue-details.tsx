// components
import { IssueReaction } from "components/issues/peek-overview";
// types

type Props = {
  issue: any;
  workspaceSlug: string;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({ issue, workspaceSlug }) => (
  <div className="space-y-2">
    <h6 className="font-medium text-custom-text-200">
      {issue.project_detail.identifier}-{issue.sequence_id}
    </h6>
    <h4 className="break-words text-2xl font-semibold">{issue.name}</h4>
    {/* <IssueReaction workspaceSlug={workspaceSlug} issueId={issue.id} projectId={issue.project} /> */}
  </div>
);
