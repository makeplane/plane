import { CustomMention } from "src/ui/mentions/custom";
import { IMentionHighlight, IMentionSuggestion } from "src/types/mention-suggestion";
import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";

import { v4 as uuidv4 } from "uuid";
import { MentionList } from "src/ui/mentions/mention-list";

export const Mentions = ({
  mentionHighlights,
  mentionSuggestions,
  readonly,
}: {
  mentionSuggestions?: () => Promise<IMentionSuggestion[]>;
  mentionHighlights?: () => Promise<IMentionHighlight[]>;
  readonly: boolean;
}) =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    readonly: readonly,
    mentionHighlights: mentionHighlights,
    suggestion: {
      // @ts-ignore
      render: () => {
        let component: ReactRenderer | null = null;
        let popup: any | null = null;

        const hidePopup = () => {
          popup?.[0].hide();
        };
        return {
          onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
            if (!props.clientRect) {
              return;
            }
            component = new ReactRenderer(MentionList, {
              props: { ...props, mentionSuggestions },
              editor: props.editor,
            });
            props.editor.storage.mentionsOpen = true;
            // @ts-expect-error - Tippy types are incorrect
            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
            // document.addEventListener("scroll", hidePopup, true);
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
              // @ts-ignore
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

            // document.removeEventListener("scroll", hidePopup, true);
          },
        };
      },
    },
  });
