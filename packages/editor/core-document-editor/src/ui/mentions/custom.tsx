import { Mention, MentionOptions } from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MentionNodeView } from "src/ui/mentions/mention-node-view";
import { IMentionHighlight } from "src/types/mention-suggestion";

export interface CustomMentionOptions extends MentionOptions {
  mentionHighlights: IMentionHighlight[];
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
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView);
  },

  parseHTML() {
    return [
      {
        tag: "mention-component",
        getAttrs: (node: string | HTMLElement) => {
          if (typeof node === "string") {
            return null;
          }
          return {
            id: node.getAttribute("data-mention-id") || "",
            target: node.getAttribute("data-mention-target") || "",
            label: node.innerText.slice(1) || "",
            redirect_uri: node.getAttribute("redirect_uri"),
          };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mention-component", mergeAttributes(HTMLAttributes)];
  },
});
