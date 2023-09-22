import { IssueReactions } from "components/issues/peek-overview";
import { TiptapEditor } from "@plane/editor";
import { useRouter } from "next/router";
// types
import { IIssue } from "types/issue";
// services
import fileService from "@/services/file.service";

type Props = {
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails: React.FC<Props> = ({ issueDetails }) => {
  const router = useRouter();
  const { workspace_slug } = router.query;

  return (
    <div className="space-y-2">
      <h6 className="font-medium text-custom-text-200">
        {issueDetails.project_detail.identifier}-{issueDetails.sequence_id}
      </h6>
      <h4 className="break-words text-2xl font-semibold">{issueDetails.name}</h4>
      {issueDetails.description_html !== "" && issueDetails.description_html !== "<p></p>" && (
        <TiptapEditor
          uploadFile={fileService.uploadFile}
          deleteFile={fileService.deleteImage}
          workspaceSlug={workspace_slug as string}
          value={
            !issueDetails.description_html ||
            issueDetails.description_html === "" ||
            (typeof issueDetails.description_html === "object" &&
              Object.keys(issueDetails.description_html).length === 0)
              ? "<p></p>"
              : issueDetails.description_html
          }
          customClassName="p-3 min-h-[50px] shadow-sm"
          debouncedUpdatesEnabled={false}
          editable={false}
        />
      )}
      <IssueReactions />
    </div>
  );
};
