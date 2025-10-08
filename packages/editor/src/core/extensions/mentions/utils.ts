import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import { CommandListInstance } from "@/helpers/tippy";
// types
import type { TMentionHandler } from "@/types";
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
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
          },
          editor: props.editor,
        });
        if (!props.clientRect) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        element.style.position = "absolute";
        element.style.zIndex = "100";
        updateFloatingUIFloaterPosition(props.editor, element);
      },
      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        updateFloatingUIFloaterPosition(props.editor, component.element);
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
