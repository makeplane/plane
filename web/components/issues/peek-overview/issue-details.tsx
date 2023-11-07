// components
import { IssueDescriptionForm, IssueReaction } from "components/issues";
// types
import { IIssue } from "types";

type Props = {
  handleUpdateIssue: (formData: Partial<IIssue>) => Promise<void>;
  issue: IIssue;
  readOnly: boolean;
  workspaceSlug: string;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({
  handleUpdateIssue,
  issue,
  readOnly,
  workspaceSlug,
}) => (
  <div className="space-y-2">
    <h6 className="font-medium text-custom-text-200">
      {issue.project_detail.identifier}-{issue.sequence_id}
    </h6>
    <IssueDescriptionForm
      handleFormSubmit={handleUpdateIssue}
      isAllowed={!readOnly}
      issue={{
        name: issue.name,
        description_html: issue.description_html,
        project_id: issue.project_detail.id,
      }}
      workspaceSlug={workspaceSlug}
    />
    <IssueReaction workspaceSlug={workspaceSlug} issueId={issue.id} projectId={issue.project} />
  </div>
);
