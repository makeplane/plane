import { computePosition, flip, type Middleware, type Strategy, type Placement, shift } from "@floating-ui/dom";
import { type Editor, posToDOMRect } from "@tiptap/core";

export const updateFloatingUIFloaterPosition = (
  editor: Editor,
  element: HTMLElement,
  options?: {
    elementStyle?: Partial<CSSStyleDeclaration>;
    middleware?: Middleware[];
    placement?: Placement;
    strategy?: Strategy;
  }
) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  computePosition(virtualElement, element, {
    placement: options?.placement ?? "bottom-start",
    strategy: options?.strategy ?? "absolute",
    middleware: options?.middleware ?? [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    Object.assign(element.style, {
      width: "max-content",
      position: strategy,
      left: `${x}px`,
      top: `${y}px`,
      ...options?.elementStyle,
    });
  });
};
