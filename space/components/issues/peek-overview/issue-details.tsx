// components
import { RichTextReadOnlyEditor } from "@/components/editor";
import { IssueReactions } from "@/components/issues/peek-overview";
// types
import { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = (props) => {
  const { anchor, issueDetails } = props;

  const description = issueDetails.description_html;

  return (
    <div className="space-y-2">
      <h6 className="text-base font-medium text-custom-text-400">
        {issueDetails.project_detail?.identifier}-{issueDetails?.sequence_id}
      </h6>
      <h4 className="break-words text-2xl font-medium">{issueDetails.name}</h4>
      {description !== "" && description !== "<p></p>" && (
        <RichTextReadOnlyEditor
          initialValue={
            !description ||
            description === "" ||
            (typeof description === "object" && Object.keys(description).length === 0)
              ? "<p></p>"
              : description
          }
        />
      )}
      <IssueReactions anchor={anchor} />
    </div>
  );
};
