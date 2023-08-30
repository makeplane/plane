// components
import { IssueReactions } from "components/issues/peek-overview";
// types
import { IIssue } from "store/types";

type Props = {
  issue: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({ issue }) => (
  <div className="space-y-2">
    <h6 className="font-medium text-custom-text-200">
      {issue.project_detail.identifier}-{issue.sequence_id}
    </h6>
    <h4 className="break-words text-2xl font-semibold">{issue.name}</h4>
    <IssueReactions />
  </div>
);
