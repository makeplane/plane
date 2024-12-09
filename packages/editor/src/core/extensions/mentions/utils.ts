import { Editor } from "@tiptap/core";
import { SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
// local components
import { MentionListDropdown } from "./mentions-list-dropdown";
// types
import { TMentionHandler } from "@/types";

export const renderMentionsDropdown =
  (props: Pick<TMentionHandler, "searchCallback">): SuggestionOptions["render"] =>
  // @ts-expect-error - Tiptap types are incorrect
  () => {
    const { searchCallback } = props;

    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
      onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
        if (!searchCallback) return;
        if (!props.clientRect) return;
        component = new ReactRenderer(MentionListDropdown, {
          props: {
            ...props,
            searchCallback,
          },
          editor: props.editor,
        });
        props.editor.storage.mentionsOpen = true;
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
          // @ts-expect-error - Tippy types are incorrect
          component?.ref?.onKeyDown(props);
          event?.stopPropagation();
          return true;
        }
        return false;
      },
      onExit: (props: { editor: Editor; event: KeyboardEvent }) => {
        props.editor.storage.mentionsOpen = false;
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  };
