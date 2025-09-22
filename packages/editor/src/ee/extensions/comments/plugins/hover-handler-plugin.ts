import { Plugin, PluginKey } from "@tiptap/pm/state";
// local imports
import { COMMENT_MARK_SELECTORS, ECommentAttributeNames } from "../types";

export const createHoverHandlerPlugin = () =>
  new Plugin({
    key: new PluginKey("commentHoverHandler"),
    props: {
      handleDOMEvents: {
        // Hover handling - inspired by comments-kit.ts mouseover event
        mouseover: (view, event) => {
          const target = event.target as HTMLElement;
          const commentMark = target.closest(COMMENT_MARK_SELECTORS.WITH_ID);

          if (commentMark) {
            // Skip hover interactions for resolved marks
            if (commentMark.getAttribute(ECommentAttributeNames.RESOLVED) === "true") {
              return false;
            }
            const commentId = commentMark.getAttribute(ECommentAttributeNames.COMMENT_ID);
            if (commentId) {
              // Add hover effect to the corresponding sidebar comment item
              const sidebarCommentItem = document.querySelector(`[data-thread-id="${commentId}"]`);
              if (sidebarCommentItem) {
                sidebarCommentItem.classList.add("bg-custom-background-90", "transition-all", "duration-200");
              }
              return true;
            }
          }

          return false;
        },
        // Hover out handling - inspired by comments-kit.ts mouseout event
        mouseout: (view, event) => {
          const target = event.target as HTMLElement;
          const commentMark = target.closest(COMMENT_MARK_SELECTORS.WITH_ID);

          if (commentMark) {
            // Skip hover-out interactions for resolved marks
            if (commentMark.getAttribute(ECommentAttributeNames.RESOLVED) === "true") {
              return false;
            }
            const commentId = commentMark.getAttribute(ECommentAttributeNames.COMMENT_ID);
            if (commentId) {
              // Remove hover effect from the corresponding sidebar comment item
              const sidebarCommentItem = document.querySelector(`[data-thread-id="${commentId}"]`);
              if (sidebarCommentItem) {
                sidebarCommentItem.classList.remove("bg-custom-background-90", "transition-all", "duration-200");
              }
              return true;
            }
          }

          return false;
        },
      },
    },
  });
