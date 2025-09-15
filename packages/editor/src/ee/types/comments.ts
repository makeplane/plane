export type TCommentConfig = {
  onClick?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onRestore?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  onCommentsOrderChange?: (commentsOrder: string[]) => void;
  onCreateCommentMark?: (selection: { from: number; to: number }, commentId: string) => void;
  onStartNewComment?: (selection?: { from: number; to: number; referenceText?: string }) => void;
  canComment?: boolean;
};
