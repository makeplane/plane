import { Plugin, PluginKey } from "@tiptap/pm/state";
// local imports
import { COMMENT_MARK_SELECTORS, ECommentAttributeNames } from "../types";

export type TClickHandlerPluginOptions = {
  onCommentClick?: (commentId: string) => void;
};

export const createClickHandlerPlugin = (options: TClickHandlerPluginOptions) => {
  const { onCommentClick } = options;

  return new Plugin({
    key: new PluginKey("commentClickHandler"),
    props: {
      handleDOMEvents: {
        click: (view, event) => {
          const target = event.target as HTMLElement;
          const commentMark = target.closest(COMMENT_MARK_SELECTORS.WITH_ID);
          const commentId = commentMark?.getAttribute(ECommentAttributeNames.COMMENT_ID);
          const isCommentResolved = commentMark?.getAttribute(ECommentAttributeNames.RESOLVED) === "true";

          if (commentMark && commentId && !isCommentResolved) {
            // Do nothing for direct mark clicks; let default editor behavior proceed
            event.preventDefault();
            event.stopPropagation();

            onCommentClick?.(commentId);
            return false;
          }

          return false;
        },
      },
    },
  });
};
