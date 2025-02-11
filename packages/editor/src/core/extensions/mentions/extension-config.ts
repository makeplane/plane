import { mergeAttributes } from "@tiptap/core";
import Mention, { MentionOptions } from "@tiptap/extension-mention";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";
// types
import { TMentionHandler } from "@/types";
// local types
import { EMentionComponentAttributeNames, TMentionComponentAttributes } from "./types";

export type TMentionExtensionOptions = MentionOptions & {
  renderComponent: TMentionHandler["renderComponent"];
  getMentionComponentAttributes: TMentionHandler["getMentionComponentAttributes"];
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

  addStorage() {
    const getMentionComponentAttributes = this.options.getMentionComponentAttributes;
    return {
      mentionsOpen: false,
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {
          const attrs = node.attrs as TMentionComponentAttributes;
          const mentionEntityId = attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER];

          const mentionEntityDetails = getMentionComponentAttributes?.(mentionEntityId);

          if (mentionEntityDetails) {
            state.write(`@${mentionEntityDetails.display_name}`);
          } else {
            state.write(`@${mentionEntityId}`);
          }
        },
      },
    };
  },
});
