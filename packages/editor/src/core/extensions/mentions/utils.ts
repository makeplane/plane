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
  (args: Pick<TMentionHandler, "searchCallback">): SuggestionOptions["render"] =>
  () => {
    const { searchCallback } = args;
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
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        element.style.position = "absolute";
        element.style.zIndex = "100";
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
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          component?.destroy();
          component = null;
          return true;
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },
      onExit: ({ editor }) => {
        editor.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        component?.element.remove();
        component?.destroy();
      },
    };
  };
