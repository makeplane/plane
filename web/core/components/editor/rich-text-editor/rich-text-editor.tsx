import React, { forwardRef } from "react";
// editor
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
// plane types
import { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

interface RichTextEditorWrapperProps
  extends Omit<IRichTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  searchMentionCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
  uploadFile: TFileHandler["upload"];
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, searchMentionCallback, uploadFile, ...rest } =
    props;
  // editor flaggings
  const { richTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: async (payload) => await searchMentionCallback(payload),
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();

  return (
    <RichTextEditorWithRef
      ref={ref}
      disabledExtensions={disabledExtensions}
      fileHandler={getEditorFileHandlers({
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
