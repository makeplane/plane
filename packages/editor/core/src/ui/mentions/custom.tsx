import { Mention, MentionOptions } from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MentionNodeView } from "src/ui/mentions/mention-node-view";
import { IMentionHighlight } from "src/types/mention-suggestion";

export interface CustomMentionOptions extends MentionOptions {
  mentionHighlights: () => Promise<IMentionHighlight[]>;
  readonly?: boolean;
}

export const CustomMention = Mention.extend<CustomMentionOptions>({
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
    return ReactNodeViewRenderer(MentionNodeView);
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
});
