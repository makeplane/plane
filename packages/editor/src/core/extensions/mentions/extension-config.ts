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
  getMentionedEntityDetails: TMentionHandler["getMentionedEntityDetails"];
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

  renderText({ node }) {
    return getMentionDisplayText(this.options, node);
  },

  addStorage() {
    const options = this.options;
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {
          state.write(getMentionDisplayText(options, node));
        },
      },
    };
  },
});

function getMentionDisplayText(options: TMentionExtensionOptions, node: NodeType): string {
  const attrs = node.attrs as TMentionComponentAttributes;
  const mentionEntityId = attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER];
  const mentionEntityDetails = options.getMentionedEntityDetails?.(mentionEntityId ?? "");
  return `@${mentionEntityDetails?.display_name ?? attrs[EMentionComponentAttributeNames.ID] ?? mentionEntityId}`;
}
