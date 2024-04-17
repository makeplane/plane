// components
import { RichTextReadOnlyEditor } from "@/components/editor";
import { IssueReactions } from "@/components/issues/peek-overview";
// types
import { IIssue } from "@/types/issue";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({ issueDetails }) => (
  <div className="space-y-2">
    <h6 className="font-medium text-custom-text-200">
      {issueDetails.project_detail.identifier}-{issueDetails.sequence_id}
    </h6>
    <h4 className="break-words text-2xl font-semibold">{issueDetails.name}</h4>
    {issueDetails.description_html !== "" && issueDetails.description_html !== "<p></p>" && (
      <RichTextReadOnlyEditor
        initialValue={
          !issueDetails.description_html ||
          issueDetails.description_html === "" ||
          (typeof issueDetails.description_html === "object" && Object.keys(issueDetails.description_html).length === 0)
            ? "<p></p>"
            : issueDetails.description_html
        }
      />
    )}
    <IssueReactions />
  </div>
);
