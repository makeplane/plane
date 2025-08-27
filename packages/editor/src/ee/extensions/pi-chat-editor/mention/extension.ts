import Mention, { MentionOptions } from "@tiptap/extension-mention";
import { mergeAttributes, ReactNodeViewRenderer, ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
// local imports
import { PiChatEditorMentionsList } from "./mentions-list";
import { PiChatEditorMentionNodeView } from "./node-view";

type CustomMentionOptions = MentionOptions & {
  mentionHighlights: () => Promise<string[]>;
  readonly?: boolean;
};

export type IMentionSuggestion = {
  id: string;
  type: string;
  entity_name: string;
  entity_identifier: string;
  avatar: string;
  title: string;
  subtitle: string;
  redirect_uri: string;
};

type Props = {
  mentionSuggestions?: (query: string) => Promise<any>;
};

export const PiChatEditorMentionExtension = (props: Props) => {
  const { mentionSuggestions } = props;

  return Mention.extend<CustomMentionOptions>({
    addStorage(this) {
      return {
        mentionsOpen: false,
      };
    },

    addAttributes() {
      return {
        id: {
          default: null,
        },
        label: {
          default: null,
        },
        target: {
          default: null,
        },
        self: {
          default: false,
        },
        redirect_uri: {
          default: "/",
        },
        entity_identifier: {
          default: null,
        },
        entity_name: {
          default: null,
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(PiChatEditorMentionNodeView);
    },
    parseHTML() {
      return [
        {
          tag: "mention-component",
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["mention-component", mergeAttributes(HTMLAttributes)];
    },
  }).configure({
    HTMLAttributes: {
      class: "mention",
    },
    suggestion: {
      items: async ({ query }) => {
        const response = await mentionSuggestions?.(query);
        return response;
      },
      render: () => {
        let component;
        let popup;

        return {
          onStart: (props) => {
            component = new ReactRenderer(PiChatEditorMentionsList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }
            // @ts-expect-error types are incorrect
            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },

          onUpdate(props) {
            component.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            });
          },

          onKeyDown(props) {
            if (props.event.key === "Escape") {
              popup[0].hide();

              return true;
            }

            return component.ref?.onKeyDown(props);
          },

          onExit() {
            popup[0].destroy();
            component.destroy();
          },
        };
      },
    },
  });
};
