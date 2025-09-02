import { RawCommands } from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { v4 as uuidv4 } from "uuid";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { ECommentAttributeNames, TCommentMarkAttributes } from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.COMMENTS]: {
      setComment: (commentId: string) => ReturnType;
      removeComment: (commentId: string) => ReturnType;
      resolveComment: (commentId: string) => ReturnType;
      unresolveComment: (commentId: string) => ReturnType;
    };
  }
}

export const commentMarkCommands = (markType: MarkType): Partial<RawCommands> => ({
  setComment:
    (commentId: string) =>
    ({ commands }) => {
      const id = uuidv4();
      const attributes: TCommentMarkAttributes = {
        [ECommentAttributeNames.COMMENT_ID]: commentId,
        [ECommentAttributeNames.ID]: id,
        [ECommentAttributeNames.RESOLVED]: false,
      };

      return commands.setMark(markType.name, attributes);
    },
  removeComment:
    (commentId: string) =>
    ({ commands, editor }) => {
      // Find all comment marks with the specified commentId in the document
      const ranges: { from: number; to: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (
            mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS &&
            markAttrs[ECommentAttributeNames.COMMENT_ID] === commentId
          ) {
            ranges.push({ from: pos, to: pos + node.nodeSize });
          }
        });
      });

      // Remove comment marks from all found ranges
      ranges.forEach((range) => {
        commands.setTextSelection(range);
        commands.unsetMark(markType.name);
      });

      return true;
    },

  resolveComment:
    (commentId: string) =>
    ({ commands, editor }) => {
      // Find all comment marks with the specified commentId and mark them as resolved
      const ranges: { from: number; to: number; attrs: TCommentMarkAttributes }[] = [];
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (
            mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS &&
            markAttrs[ECommentAttributeNames.COMMENT_ID] === commentId
          ) {
            ranges.push({
              from: pos,
              to: pos + node.nodeSize,
              attrs: { ...markAttrs, [ECommentAttributeNames.RESOLVED]: true } as TCommentMarkAttributes,
            });
          }
        });
      });

      // Update comment marks to resolved state
      ranges.forEach((range) => {
        commands.setTextSelection({ from: range.from, to: range.to });
        commands.unsetMark(markType.name);
        commands.setMark(markType.name, range.attrs);
      });

      return true;
    },

  unresolveComment:
    (commentId: string) =>
    ({ commands, editor }) => {
      // Find all comment marks with the specified commentId and mark them as unresolved
      const ranges: { from: number; to: number; attrs: TCommentMarkAttributes }[] = [];
      editor.state.doc.descendants((node, pos) => {
        node.marks.forEach((mark) => {
          const markAttrs = mark.attrs as TCommentMarkAttributes;
          if (
            mark.type.name === ADDITIONAL_EXTENSIONS.COMMENTS &&
            markAttrs[ECommentAttributeNames.COMMENT_ID] === commentId
          ) {
            ranges.push({
              from: pos,
              to: pos + node.nodeSize,
              attrs: { ...markAttrs, [ECommentAttributeNames.RESOLVED]: false } as TCommentMarkAttributes,
            });
          }
        });
      });

      // Update comment marks to unresolved state
      ranges.forEach((range) => {
        commands.setTextSelection({ from: range.from, to: range.to });
        commands.unsetMark(markType.name);
        commands.setMark(markType.name, range.attrs);
      });

      return true;
    },
});
