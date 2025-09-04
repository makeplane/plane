import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// constants
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { ECommentAttributeNames, TCommentMarkAttributes } from "../types";

const COMMENT_DELETE_PLUGIN_KEY = new PluginKey("comment-delete-utility");

export type TCommentDeleteHandler = (commentId: string) => void;

export const TrackCommentDeletionPlugin = (editor: Editor, deleteHandler: TCommentDeleteHandler): Plugin =>
  new Plugin({
    key: COMMENT_DELETE_PLUGIN_KEY,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const oldCommentIds = new Set<string>();
      const newCommentIds = new Set<string>();

      // Collect comment IDs from old state
      oldState.doc.descendants((node) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS && markAttrs[ECommentAttributeNames.COMMENT_ID]) {
            oldCommentIds.add(markAttrs[ECommentAttributeNames.COMMENT_ID]);
          }
        });
      });

      // Collect comment IDs from new state
      newState.doc.descendants((node) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS && markAttrs[ECommentAttributeNames.COMMENT_ID]) {
            newCommentIds.add(markAttrs[ECommentAttributeNames.COMMENT_ID]);
          }
        });
      });

      // Find deleted comments
      const deletedCommentIds = Array.from(oldCommentIds).filter((id) => !newCommentIds.has(id));

      // Trigger deletion handler for each deleted comment
      deletedCommentIds.forEach(async (commentId) => {
        setTimeout(async () => {
          try {
            // Initialize comment storage if it doesn't exist
            if (!getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments) {
              getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments = new Map();
            }

            // Mark comment as deleted in storage
            const commentStorage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments;
            commentStorage?.set(commentId, true);

            // Call the delete handler
            await deleteHandler(commentId);
          } catch (error) {
            console.error("Error deleting comment via delete utility plugin:", error);
          }
        }, 0);
      });

      return null;
    },
  });
