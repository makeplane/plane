import { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { SuggestionOptions } from "@tiptap/suggestion";
import tippy, { Instance } from "tippy.js";
// helpers
import { CORE_EXTENSIONS } from "@/constants/extension";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
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
    let popup: Instance | null = null;

    return {
      onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
        if (!searchCallback) return;
        if (!props.clientRect) return;
        component = new ReactRenderer<CommandListInstance, MentionsListDropdownProps>(MentionsListDropdown, {
          props: {
            ...props,
            searchCallback,
          },
          editor: props.editor,
        });
        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeDropbarExtensions.push(
          CORE_EXTENSIONS.MENTION
        );
        // @ts-expect-error - Tippy types are incorrect
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () =>
            document.querySelector(".active-editor") ?? document.querySelector('[id^="editor-container"]'),
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },
      onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
        component?.updateProps(props);
        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }

        const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];

        if (navigationKeys.includes(props.event.key)) {
          props.event?.stopPropagation();
          if (component?.ref?.onKeyDown(props)) {
            return true;
          }
        }
        return false;
      },
      onExit: (props: { editor: Editor; event: KeyboardEvent }) => {
        const utilityStorage = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
        const index = utilityStorage.activeDropbarExtensions.indexOf(CORE_EXTENSIONS.MENTION);
        if (index > -1) {
          utilityStorage.activeDropbarExtensions.splice(index, 1);
        }
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  };
