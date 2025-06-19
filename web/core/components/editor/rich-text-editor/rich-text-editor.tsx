import React, { forwardRef } from "react";
// plane imports
import { EditorRefApi, IRichTextEditorProps, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// components
import { cn } from "@plane/utils";
import { EditorMentionsRoot } from "@/components/editor";
// helpers
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
// store hooks
import { useMember, useUserProfile } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

interface RichTextEditorWrapperProps
  extends MakeOptional<
    Omit<IRichTextEditorProps, "fileHandler" | "mentionHandler">,
    "disabledExtensions" | "flaggedExtensions" | "isSmoothCursorEnabled"
  > {
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
  const {
    data: { is_smooth_cursor_enabled },
  } = useUserProfile();
  // editor flaggings
  const { richText: richTextEditorExtensions } = useEditorFlagging(workspaceSlug?.toString());
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: async (payload) => await searchMentionCallback(payload),
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();

  return (
    <RichTextEditorWithRef
      ref={ref}
      disabledExtensions={[...richTextEditorExtensions.disabled, ...(additionalDisabledExtensions ?? [])]}
      flaggedExtensions={richTextEditorExtensions.flagged}
      fileHandler={getEditorFileHandlers({
        projectId,
        uploadFile,
        workspaceId,
        workspaceSlug,
      })}
      isSmoothCursorEnabled={is_smooth_cursor_enabled}
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
