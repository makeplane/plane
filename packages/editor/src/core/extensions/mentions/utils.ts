import { computePosition, flip, shift } from "@floating-ui/dom";
import { type Editor, posToDOMRect } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { SuggestionOptions } from "@tiptap/suggestion";
// helpers
import { CORE_EXTENSIONS } from "@/constants/extension";
import { CommandListInstance } from "@/helpers/tippy";
// types
import { TMentionHandler } from "@/types";
// local components
import { MentionsListDropdown, MentionsListDropdownProps } from "./mentions-list-dropdown";

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = "max-content";
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
};

export const renderMentionsDropdown =
  (props: Pick<TMentionHandler, "searchCallback">): SuggestionOptions["render"] =>
  // @ts-expect-error - Tiptap types are incorrect
  () => {
    const { searchCallback } = props;
    let component: ReactRenderer<CommandListInstance, MentionsListDropdownProps> | null = null;

    return {
      onStart: (props) => {
        if (!searchCallback) return;
        if (!props.clientRect) return;
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
          },
          editor: props.editor,
        });
        props.editor.storage.utility.activeDropbarExtensions.push(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        element.style.position = "absolute";
        document.body.appendChild(element);
        updatePosition(props.editor, element);
      },
      onUpdate: (props) => {
        component?.updateProps(props);
        if (!props.clientRect) return;
        if (component?.element) {
          updatePosition(props.editor, component?.element as HTMLElement);
        }
      },
      onKeyDown: (props) => {
        if (props.event.key === "Escape") {
          component?.destroy();
          return true;
        }

        const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];

        if (navigationKeys.includes(props.event.key)) {
          props.event?.stopPropagation();
          return component?.ref?.onKeyDown(props);
        }
        return component?.ref?.onKeyDown(props);
      },
      onExit: () => {
        component?.element.remove();
        component?.destroy();
      },
    };
  };
