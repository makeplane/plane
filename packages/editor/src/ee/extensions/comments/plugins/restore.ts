import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { ECommentAttributeNames, TCommentMarkAttributes } from "../types";

const COMMENT_RESTORE_PLUGIN_KEY = new PluginKey("comment-restore-utility");

export type TCommentRestoreHandler = (commentId: string) => void;

export const TrackCommentRestorationPlugin = (editor: Editor, restoreHandler: TCommentRestoreHandler): Plugin =>
  new Plugin({
    key: COMMENT_RESTORE_PLUGIN_KEY,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const oldCommentIds = new Set<string>();

      // Collect comment IDs from old state
      oldState.doc.descendants((node) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS && markAttrs[ECommentAttributeNames.COMMENT_ID]) {
            oldCommentIds.add(markAttrs[ECommentAttributeNames.COMMENT_ID]);
          }
        });
      });

      transactions.forEach(() => {
        const addedComments: string[] = [];

        // Find comments that are present in new state but not in old state
        newState.doc.descendants((node, pos) => {
          if (pos < 0 || pos > newState.doc.content.size) return;

          node.marks.forEach((mark) => {
            const markAttrs = mark.attrs as TCommentMarkAttributes;
            if (mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS && markAttrs[ECommentAttributeNames.COMMENT_ID]) {
              const commentId = markAttrs[ECommentAttributeNames.COMMENT_ID];
              // Only add if this comment wasn't in the old state
              if (!oldCommentIds.has(commentId)) {
                addedComments.push(commentId);
              }
            }
          });
        });

        // Check each added comment to see if it was previously deleted
        addedComments.forEach(async (commentId) => {
          // Initialize comment storage if it doesn't exist
          if (!getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments) {
            getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments = new Map();
          }

          const commentStorage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.COMMENTS).deletedComments;
          const wasDeleted = commentStorage?.get(commentId);

          if (wasDeleted === undefined) {
            // Comment is new, mark as not deleted
            commentStorage?.set(commentId, false);
          } else if (wasDeleted === true) {
            // Comment was previously deleted and is now restored
            try {
              await restoreHandler(commentId);
              commentStorage?.set(commentId, false);
            } catch (error) {
              console.error("Error restoring comment via restore utility plugin:", error);
            }
          }
        });
      });

      return null;
    },
  });
