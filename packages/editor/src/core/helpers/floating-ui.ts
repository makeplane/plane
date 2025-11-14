import { computePosition, flip, shift, autoUpdate } from "@floating-ui/dom";
import type { Placement, ReferenceElement, Strategy } from "@floating-ui/dom";
import { posToDOMRect } from "@tiptap/core";
import type { Editor } from "@tiptap/core";

export type UpdateFloatingUIFloaterPosition = (
  editor: Editor,
  element: HTMLElement,
  options?: {
    elementStyle?: Partial<CSSStyleDeclaration>;
    placement?: Placement;
    strategy?: Strategy;
  }
) => {
  cleanup: () => void;
};

export const updateFloatingUIFloaterPosition: UpdateFloatingUIFloaterPosition = (editor, element, options) => {
  document.body.appendChild(element);

  const virtualElement: ReferenceElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  const cleanup = autoUpdate(virtualElement, element, () => {
    computePosition(virtualElement, element, {
      placement: options?.placement ?? "bottom-start",
      strategy: options?.strategy ?? "fixed",
      middleware: [shift(), flip()],
    })
      .then(({ x, y, strategy }) => {
        Object.assign(element.style, {
          width: "max-content",
          position: strategy,
          left: `${x}px`,
          top: `${y}px`,
          ...options?.elementStyle,
        });
      })
      .catch((error) => console.error("An error occurred while updating floating UI floater position:", error));
  });

  return {
    cleanup,
  };
};
