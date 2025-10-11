import { type Editor, ReactRenderer } from "@tiptap/react";
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
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
      cleanup();
    };

    return {
      onStart: (props) => {
        if (!searchCallback) return;
        editorRef = props.editor;
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
            onClose: () => handleClose(props.editor),
          } satisfies MentionsListDropdownProps,
          editor: props.editor,
          className: "fixed z-[100]",
        });
        if (!props.clientRect) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.MENTION);
        const element = component.element as HTMLElement;
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },
      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        cleanup();
        cleanup = updateFloatingUIFloaterPosition(props.editor, component.element).cleanup;
      },
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          handleClose();
          return true;
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },
      onExit: ({ editor }) => {
        component?.element.remove();
        handleClose(editor);
      },
    };
  };
