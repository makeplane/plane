import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";

import MentionList from "./MentionList";
import { IMentionSuggestion } from "@plane/editor-types";

const Suggestion = (suggestions: IMentionSuggestion[]) => ({
  items: ({ query }: { query: string }) =>
    suggestions.filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5),
  render: () => {
    let reactRenderer: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
      onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
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

        // @ts-ignore
        return reactRenderer?.ref?.onKeyDown(props);
      },
      onExit: () => {
        popup?.[0].destroy();
        reactRenderer?.destroy();
      },
    };
  },
});

export default Suggestion;
