import { observer } from "mobx-react";
// components
import { RichTextReadOnlyEditor } from "@/components/editor";
import { IssueReactions } from "@/components/issues/peek-overview";
import { usePublish } from "@/hooks/store";
// types
import { IIssue } from "@/types/issue";

type Props = {
  anchor: string;
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = observer((props) => {
  const { anchor, issueDetails } = props;

  const { project_details } = usePublish(anchor);

  const description = issueDetails.description_html;

  return (
    <div className="space-y-2">
      <h6 className="text-base font-medium text-custom-text-400">
        {project_details?.identifier}-{issueDetails?.sequence_id}
      </h6>
      <h4 className="break-words text-2xl font-medium">{issueDetails.name}</h4>
      {description !== "" && description !== "<p></p>" && (
        <RichTextReadOnlyEditor
          anchor={anchor}
          id={issueDetails.id}
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
});
