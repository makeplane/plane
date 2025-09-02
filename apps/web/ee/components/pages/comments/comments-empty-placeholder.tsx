import React from "react";
import { MessageCircle } from "lucide-react";

export type CommentsEmptyStateProps = {
  hasComments: boolean;
};

export function PageCommentsEmptyState({ hasComments }: CommentsEmptyStateProps) {
  const title = hasComments ? "No comments match current filters" : "No comments yet";
  const message = hasComments
    ? "Try adjusting your filters to see more comments."
    : "Select text in the editor and add a comment to get started.";

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-3">
      <MessageCircle className="size-8 text-custom-text-300" />
      <div className="text-center">
        <h4 className="text-sm font-medium text-custom-text-200">{title}</h4>
        <p className="text-xs text-custom-text-300 mt-1">{message}</p>
      </div>
    </div>
  );
}
