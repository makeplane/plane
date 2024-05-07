import { FC, RefObject } from "react";
import { observer } from "mobx-react";
import { EditorRefApi } from "@plane/rich-text-editor";
import { TIssue } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { RichTextEditor } from "@/components/editor/rich-text-editor/rich-text-editor";
// helpers
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useProjectInbox } from "@/hooks/store";

type TInboxIssueDescription = {
  containerClassName?: string;
  workspaceSlug: string;
  projectId: string;
  workspaceId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  editorRef: RefObject<EditorRefApi>;
};

// TODO: have to implement GPT Assistance
export const InboxIssueDescription: FC<TInboxIssueDescription> = observer((props) => {
  const { containerClassName, workspaceSlug, projectId, workspaceId, data, handleData, editorRef } = props;
  // hooks
  const { loader } = useProjectInbox();

  if (loader === "issue-loading")
    return (
      <Loader className="min-h-[6rem] rounded-md border border-custom-border-200">
        <Loader.Item width="100%" height="140px" />
      </Loader>
    );

  return (
    <RichTextEditor
      initialValue={!data?.description_html || data?.description_html === "" ? "<p></p>" : data?.description_html}
      ref={editorRef}
      workspaceSlug={workspaceSlug}
      workspaceId={workspaceId}
      projectId={projectId}
      dragDropEnabled={false}
      onChange={(_description: object, description_html: string) => handleData("description_html", description_html)}
      placeholder={getDescriptionPlaceholder}
      containerClassName={containerClassName}
    />
  );
});
