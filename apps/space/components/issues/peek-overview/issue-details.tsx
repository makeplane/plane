import { IssueReactions } from "components/issues/peek-overview";
// types
import { IIssue } from "types";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({ issueDetails }) => (
  <div className="space-y-2">
    <h6 className="font-medium text-custom-text-200">
      {issueDetails.project_detail.identifier}-{issueDetails.sequence_id}
    </h6>
    <h4 className="break-words text-2xl font-semibold">{issueDetails.name}</h4>
    <IssueReactions />
  </div>
);
