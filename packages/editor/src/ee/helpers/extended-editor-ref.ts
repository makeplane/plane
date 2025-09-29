import type { Editor } from "@tiptap/core";
import { getCommentSelector } from "../extensions/comments";
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
    hoverCommentMarks: (commentIds) => {
      if (!editor) return;
      editor.commands.hoverComments(commentIds);
    },
    selectCommentMark: (commentId) => {
      if (!editor) return;
      editor.commands.selectComment(commentId);
    },
    scrollToCommentMark: (commentId) => {
      if (!editor || !commentId) return;
      const selector = getCommentSelector(commentId);
      const element = editor.view.dom.querySelector(selector) as HTMLElement | null;

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  };
};
