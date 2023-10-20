import { FC } from "react";
// packages
import { RichTextEditor } from "@plane/rich-text-editor";
// components
import { IssueReaction } from "./reactions";
// hooks
import { useDebouncedCallback } from "use-debounce";
// types
import { IIssue } from "types";
// services
import { FileService } from "services/file.service";

const fileService = new FileService();

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  issue: IIssue;
  issueReactions: any;
  user: any;
  issueUpdate: (issue: Partial<IIssue>) => void;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = (props) => {
  const { workspaceSlug, issue, issueReactions, user, issueUpdate, issueReactionCreate, issueReactionRemove } = props;

  const debouncedIssueDescription = useDebouncedCallback(async (_data: any) => {
    issueUpdate({ ...issue, description_html: _data });
  }, 1500);

  return (
    <div className="space-y-3">
      <div className="font-medium text-sm text-custom-text-200">
        {issue?.project_detail?.identifier}-{issue?.sequence_id}
      </div>

      <div className="font-medium text-xl">{issue?.name}</div>

      <div className="space-y-2">
        <RichTextEditor
          uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
          deleteFile={fileService.deleteImage}
          value={issue?.description_html}
          debouncedUpdatesEnabled={false}
          onChange={(description: Object, description_html: string) => {
            debouncedIssueDescription(description_html);
          }}
        />

        <IssueReaction
          issueReactions={issueReactions}
          user={user}
          issueReactionCreate={issueReactionCreate}
          issueReactionRemove={issueReactionRemove}
        />
      </div>
    </div>
  );
};
