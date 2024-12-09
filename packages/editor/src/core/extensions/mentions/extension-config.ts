import { mergeAttributes } from "@tiptap/core";
import Mention, { MentionOptions } from "@tiptap/extension-mention";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node } from "@tiptap/pm/model";
// types
import { TMentionHandler } from "@/types";
// local types
import { EMentionComponentAttributeNames } from "./types";

export type TMentionExtensionOptions = MentionOptions & {
  renderComponent: TMentionHandler["renderComponent"];
};

export const CustomMentionExtensionConfig = Mention.extend<TMentionExtensionOptions>({
  addAttributes() {
    return {
      [EMentionComponentAttributeNames.ID]: {
        default: null,
      },
      [EMentionComponentAttributeNames.ENTITY_IDENTIFIER]: {
        default: null,
      },
      [EMentionComponentAttributeNames.ENTITY_NAME]: {
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

  addStorage(this) {
    return {
      mentionsOpen: false,
      markdown: {
        serialize(state: MarkdownSerializerState, node: Node) {
          const { attrs } = node;
          const label = `@${state.esc(attrs.label)}`;
          const originUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
          const safeRedirectionPath = state.esc(attrs.redirect_uri);
          const url = `${originUrl}${safeRedirectionPath}`;
          state.write(`[${label}](${url})`);
        },
      },
    };
  },
});
