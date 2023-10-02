import { IssueReactions } from "components/issues/peek-overview";
import { RichReadOnlyEditor } from "@plane/rich-text-editor";
// types
import { IIssue } from "types/issue";

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
      <RichReadOnlyEditor
        value={!issueDetails.description_html ||
          issueDetails.description_html === "" ||
          (typeof issueDetails.description_html === "object" &&
            Object.keys(issueDetails.description_html).length === 0)
          ? "<p></p>"
          : issueDetails.description_html}
        customClassName="p-3 min-h-[50px] shadow-sm" />
    )}
    <IssueReactions />
  </div>
);
