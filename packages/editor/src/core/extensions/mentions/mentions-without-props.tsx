import { mergeAttributes } from "@tiptap/core";
import Mention, { MentionOptions } from "@tiptap/extension-mention";
// types
import { IMentionHighlight } from "@/types";

interface CustomMentionOptions extends MentionOptions {
  mentionHighlights: () => Promise<IMentionHighlight[]>;
  readonly?: boolean;
}

export const CustomMentionWithoutProps = () =>
  Mention.extend<CustomMentionOptions>({
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
    HTMLAttributes: {
      class: "mention",
    },
  });
