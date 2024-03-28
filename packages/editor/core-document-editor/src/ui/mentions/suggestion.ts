import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";

import { MentionList } from "src/ui/mentions/mention-list";
import { IMentionSuggestion } from "src/types/mention-suggestion";

export const Suggestion = (suggestions: IMentionSuggestion[]) => ({
  items: ({ query }: { query: string }) =>
    suggestions.filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5),
  render: () => {
    let reactRenderer: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
      onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
        props.editor.storage.mentionsOpen = true;
        reactRenderer = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });
        // @ts-ignore
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.querySelector("#editor-container"),
          content: reactRenderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
        reactRenderer?.updateProps(props);

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
          reactRenderer?.ref?.onKeyDown(props);
          event?.stopPropagation();
          return true;
        }
        return false;
      },
      onExit: (props: { editor: Editor; event: KeyboardEvent }) => {
        props.editor.storage.mentionsOpen = false;
        popup?.[0].destroy();
        reactRenderer?.destroy();
      },
    };
  },
});
