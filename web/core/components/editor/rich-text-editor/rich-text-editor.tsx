import React, { forwardRef } from "react";
// editor
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef } from "@plane/editor";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useEditorMention } from "@/hooks/use-editor-mention";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface RichTextEditorWrapperProps
  extends Omit<IRichTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  uploadFile: (file: File) => Promise<string>;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, uploadFile, ...rest } = props;
  // editor flaggings
  const { richTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // use editor mention
  const { fetchMentions } = useEditorMention({
    projectId: projectId?.toString() ?? "",
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  // file size
  const { maxFileSize } = useFileSize();

  return (
    <RichTextEditorWithRef
      ref={ref}
      disabledExtensions={disabledExtensions}
      fileHandler={getEditorFileHandlers({
        maxFileSize,
        projectId,
        uploadFile,
        workspaceId,
        workspaceSlug,
      })}
      mentionHandler={{
        searchCallback: async (query) => {
          const res = await fetchMentions(query);
          if (!res) throw new Error("Failed in fetching mentions");
          return res;
        },
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
      }}
      {...rest}
      containerClassName={cn("relative pl-3", containerClassName)}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
