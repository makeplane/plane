import { Plugin, PluginKey } from "@tiptap/pm/state";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { ECommentAttributeNames, TCommentMarkAttributes, TCommentMarkStorage } from "../types";

export type TCommentsOrderPluginOptions = {
  storage: TCommentMarkStorage;
};

export const createCommentsOrderPlugin = (options: TCommentsOrderPluginOptions) => {
  const { storage } = options;

  return new Plugin({
    key: new PluginKey("commentsOrderTracker"),
    appendTransaction: (_, __, newState) => {
      const commentPositions: { commentId: string; position: number }[] = [];

      // Traverse the document to find all comment marks and their positions
      newState.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS && markAttrs[ECommentAttributeNames.COMMENT_ID]) {
            // Check if this commentId is already in our array
            const existingIndex = commentPositions.findIndex(
              (item) => item.commentId === markAttrs[ECommentAttributeNames.COMMENT_ID]
            );

            if (existingIndex === -1) {
              // If not found, add it with current position
              commentPositions.push({
                commentId: markAttrs[ECommentAttributeNames.COMMENT_ID],
                position: pos,
              });
            } else {
              // If found, update with the earliest position (closest to document start)
              if (pos < commentPositions[existingIndex].position) {
                commentPositions[existingIndex].position = pos;
              }
            }
          }
        });
      });

      // Sort by position and update storage
      const newCommentOrder = commentPositions.sort((a, b) => a.position - b.position).map((item) => item.commentId);

      // Only update storage if order has changed
      const currentOrder = storage.commentsOrder;
      if (JSON.stringify(currentOrder) !== JSON.stringify(newCommentOrder)) {
        storage.commentsOrder = newCommentOrder;
      }

      return null;
    },
  });
};
