import { type Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { useEffect } from "react";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { type ICollaborativeDocumentEditorProps, EventToPayloadMap, IEditorPropsExtended } from "@/types";
import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";

type DocumentEditorSideEffectsProps = {
  editor: Editor;
  id: string;
  updatePageProperties?: ICollaborativeDocumentEditorProps["updatePageProperties"];
  extendedEditorProps?: IEditorPropsExtended;
};

export const DocumentEditorSideEffects = ({
  editor,
  id,
  updatePageProperties,
  extendedEditorProps,
}: DocumentEditorSideEffectsProps) => {
  const { commentConfig } = extendedEditorProps ?? {};
  const { users } = useEditorState({
    editor,
    selector: (ctx) => ({
      users: getExtensionStorage(ctx.editor, ADDITIONAL_EXTENSIONS.COLLABORATION_CURSOR)?.users || [],
    }),
  });

  const { commentsOrder } = useEditorState({
    editor,
    selector: (ctx) => ({
      commentsOrder: getExtensionStorage(ctx.editor, ADDITIONAL_EXTENSIONS.COMMENTS)?.commentsOrder || [],
    }),
  });

  // Update page properties when collaborators change
  useEffect(() => {
    if (!users || !updatePageProperties) return;

    const currentUsers = users;

    const collaboratorPayload: EventToPayloadMap["collaborators-updated"] = {
      users: currentUsers,
    };

    updatePageProperties(id, "collaborators-updated", collaboratorPayload, false);
  }, [users, updatePageProperties, id, editor]);

  useEffect(() => {
    if (!commentsOrder) return;
    commentConfig?.onCommentsOrderChange?.(commentsOrder);
  }, [commentsOrder, commentConfig]);

  return null;
};
