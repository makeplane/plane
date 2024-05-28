import { CustomMention } from "./custom";
import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";

import { MentionList } from "./mention-list";

export const MentionsWithoutProps = () =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    // mentionHighlights: mentionHighlights,
    suggestion: {
      // @ts-expect-error - Tiptap types are incorrect
      render: () => {
        let component: ReactRenderer | null = null;
        let popup: any | null = null;

        return {
          onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
            if (!props.clientRect) {
              return;
            }
            component = new ReactRenderer(MentionList, {
              props: { ...props },
              editor: props.editor,
            });
            props.editor.storage.mentionsOpen = true;
            // @ts-expect-error - Tippy types are incorrect
            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.querySelector(".active-editor") ?? document.querySelector("#editor-container"),
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },
          onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
            component?.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            popup &&
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
          },

          onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === "Escape") {
              popup?.[0].hide();

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
            popup?.[0].destroy();
            component?.destroy();
          },
        };
      },
    },
  });
