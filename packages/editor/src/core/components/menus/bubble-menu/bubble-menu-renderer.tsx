import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { type BubbleMenuPluginProps, BubbleMenuPlugin } from "./bubble-menu-plugin";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type BubbleMenuProps = Optional<Omit<Optional<BubbleMenuPluginProps, "pluginKey">, "element">, "editor"> &
  React.HTMLAttributes<HTMLDivElement>;

export const BubbleMenu = React.forwardRef<HTMLDivElement, BubbleMenuProps>(
  (
    { pluginKey = "bubbleMenu", editor, updateDelay, resizeDelay, shouldShow = null, options, children, ...restProps },
    ref
  ) => {
    const menuEl = useRef(document.createElement("div"));

    if (typeof ref === "function") {
      ref(menuEl.current);
    } else if (ref) {
      ref.current = menuEl.current;
    }

    useEffect(() => {
      const bubbleMenuElement = menuEl.current;

      bubbleMenuElement.style.visibility = "hidden";
      bubbleMenuElement.style.position = "absolute";

      if (editor?.isDestroyed) {
        return;
      }

      const attachToEditor = editor;

      if (!attachToEditor) {
        console.warn(
          "BubbleMenu component is not rendered inside of an editor component or does not have editor prop."
        );
        return;
      }

      const plugin = BubbleMenuPlugin({
        updateDelay,
        resizeDelay,
        editor: attachToEditor,
        element: bubbleMenuElement,
        pluginKey,
        shouldShow,
        options,
      });

      attachToEditor.registerPlugin(plugin);

      return () => {
        attachToEditor.unregisterPlugin(pluginKey);
        window.requestAnimationFrame(() => {
          if (bubbleMenuElement.parentNode) {
            bubbleMenuElement.parentNode.removeChild(bubbleMenuElement);
          }
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    return createPortal(<div {...restProps}>{children}</div>, menuEl.current);
  }
);
