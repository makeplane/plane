import { FC, RefObject } from "react";
import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/rich-text-editor";
import { TIssue } from "@plane/types";
// components
import { RichTextEditor } from "@/components/editor/rich-text-editor/rich-text-editor";

type TInboxIssueDescription = {
  workspaceSlug: string;
  projectId: string;
  workspaceId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  editorRef: RefObject<EditorRefApi>;
};

// TODO: have to implement GPT Assistance
export const InboxIssueDescription: FC<TInboxIssueDescription> = observer((props) => {
  const { workspaceSlug, projectId, workspaceId, data, handleData, editorRef } = props;

  return (
    <div className="relative border border-red-500">
      <RichTextEditor
        initialValue={!data?.description_html || data?.description_html === "" ? "<p></p>" : data?.description_html}
        ref={editorRef}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        projectId={projectId}
        dragDropEnabled={false}
        onChange={(_description: object, description_html: string) => {
          handleData("description_html", description_html);
        }}
      />
    </div>
  );
});
