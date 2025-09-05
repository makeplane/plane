import type { Editor } from "@tiptap/core";
import { TExtendedEditorRefApi } from "../types";

type TArgs = {
  editor: Editor | null;
};

export const getExtenedEditorRefHelpers = (args: TArgs): TExtendedEditorRefApi => {
  const { editor } = args;

  return {
    removeComment: (commentId) => {
      if (!editor) return;
      editor.chain().focus().removeComment(commentId).run();
    },
    setCommentMark: ({ commentId, from, to }) => {
      if (!editor) return;
      editor.chain().focus().setTextSelection({ from, to }).setComment(commentId).run();
    },
    resolveCommentMark: (commentId) => {
      if (!editor) return;
      editor.chain().focus().resolveComment(commentId).run();
    },
    unresolveCommentMark: (commentId) => {
      if (!editor) return;
      editor.chain().focus().unresolveComment(commentId).run();
    },
  };
};
