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
      onStart: ({ clientRect, editor }) => {
        if (!searchCallback) return;
        if (!clientRect) return;
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
          },
          editor: editor,
        });
        editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        element.style.position = "absolute";
        document.body.appendChild(element);
        updateFloatingUIFloaterPosition(editor, element);
      },
      onUpdate: ({ clientRect, editor }) => {
        component?.updateProps(props);
        if (!clientRect) return;
        if (component?.element) {
          updateFloatingUIFloaterPosition(editor, component?.element as HTMLElement);
        }
      },
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          component?.destroy();
          return true;
        }

        const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];

        if (navigationKeys.includes(event.key)) {
          event?.stopPropagation();
          return component?.ref?.onKeyDown({ event });
        }
        return component?.ref?.onKeyDown({ event });
      },
      onExit: ({ editor }) => {
        editor.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        component?.element.remove();
        component?.destroy();
      },
    };
  };
