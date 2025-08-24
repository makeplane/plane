import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import { CommandListInstance } from "@/helpers/tippy";
// types
import { TMentionHandler } from "@/types";
// local components
import { MentionsListDropdown, MentionsListDropdownProps } from "./mentions-list-dropdown";

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
        updateFloatingUIFloaterPosition(props.editor, element);
      },
      onUpdate: (props) => {
        component?.updateProps(props);
        if (!props.clientRect) return;
        if (component?.element) {
          updateFloatingUIFloaterPosition(props.editor, component?.element as HTMLElement);
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
