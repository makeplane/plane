import { CustomMention } from "src/ui/mentions/custom";
import { IMentionHighlight, IMentionSuggestion } from "src/types/mention-suggestion";
import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import tippy from "tippy.js";

import { v4 as uuidv4 } from "uuid";
import { MentionList } from "src/ui/mentions/mention-list";

export const getSuggestionItems =
  (getSuggestions: () => Promise<IMentionSuggestion[]>) =>
  async ({ query }: { query: string }) => {
    console.log("yaa");
    const suggestions = await getSuggestions();
    const mappedSuggestions: IMentionSuggestion[] = suggestions.map((suggestion): IMentionSuggestion => {
      const transactionId = uuidv4();
      return {
        ...suggestion,
        id: transactionId,
      };
    });
    const filteredSuggestions = mappedSuggestions
      .filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);

    console.log("yoo", filteredSuggestions);
    return filteredSuggestions;
  };

export const Mentions = (
  mentionSuggestions: () => Promise<IMentionSuggestion[]>,
  mentionHighlights: IMentionHighlight[],
  readonly: boolean
) =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    readonly: readonly,
    mentionHighlights: mentionHighlights,
    suggestion: {
      items: ({ query }) => {
        const suggestions = mentionSuggestions();
        const mappedSuggestions: IMentionSuggestion[] = suggestions.map((suggestion): IMentionSuggestion => {
          const transactionId = uuidv4();
          return {
            ...suggestion,
            id: transactionId,
          };
        });
        const filteredSuggestions = mappedSuggestions
          .filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 5);

        console.log("yoo", filteredSuggestions);
        return filteredSuggestions;
      },
      // @ts-ignore
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
    },
  });
