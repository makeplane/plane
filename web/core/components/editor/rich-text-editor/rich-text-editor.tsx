import React, { forwardRef } from "react";
// plane imports
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// components
import { cn } from "@plane/utils";
import { EditorMentionsRoot } from "@/components/editor";
// helpers
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
// store hooks
import { useMember } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

interface RichTextEditorWrapperProps
  extends MakeOptional<Omit<IRichTextEditor, "fileHandler" | "mentionHandler">, "disabledExtensions"> {
  searchMentionCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
  uploadFile: TFileHandler["upload"];
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const {
    containerClassName,
    workspaceSlug,
    workspaceId,
    projectId,
    searchMentionCallback,
    uploadFile,
    disabledExtensions: additionalDisabledExtensions,
    ...rest
  } = props;
  // store hooks
  const { getUserDetails } = useMember();
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
      disabledExtensions={[...disabledExtensions, ...(additionalDisabledExtensions ?? [])]}
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
        getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
      }}
      {...rest}
      containerClassName={cn("relative pl-3 pb-3", containerClassName)}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
