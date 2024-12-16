import { mergeAttributes } from "@tiptap/core";
import Mention, { MentionOptions } from "@tiptap/extension-mention";
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
    };
  },
});
