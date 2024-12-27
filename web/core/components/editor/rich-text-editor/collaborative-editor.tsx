import React, { forwardRef } from "react";
// editor
import { CollaborativeRichTextEditorWithRef, EditorRefApi, ICollaborativeRichTextEditor } from "@plane/editor";
// types
import { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
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

interface Props extends Omit<ICollaborativeRichTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  key: string;
  projectId: string;
  searchMentionCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  workspaceSlug: string;
}

export const CollaborativeRichTextEditor = forwardRef<EditorRefApi, Props>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, searchMentionCallback, uploadFile, ...rest } =
    props;
  // editor flaggings
  const { richTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: async (payload) => await searchMentionCallback(payload),
  });
  // file size
  const { maxFileSize } = useFileSize();

  return (
    <CollaborativeRichTextEditorWithRef
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

CollaborativeRichTextEditor.displayName = "CollaborativeRichTextEditor";
