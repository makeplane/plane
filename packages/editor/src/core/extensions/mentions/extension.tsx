import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
// types
import { TMentionHandler } from "@/types";
// extension config
import { CustomMentionExtensionConfig } from "./extension-config";
// node view
import { MentionNodeView } from "./mention-node-view";
// utils
import { EMentionComponentAttributeNames } from "./types";
import { renderMentionsDropdown } from "./utils";

export const CustomMentionExtension = (props: TMentionHandler) => {
  const { searchCallback, renderComponent, getMentionedEntityDetails } = props;
  return CustomMentionExtensionConfig.extend({
    addOptions(this) {
      return {
        ...this.parent?.(),
        renderComponent,
        getMentionedEntityDetails,
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(MentionNodeView);
    },

    // @ts-expect-error - TODO: fix this
    addStorage() {
      return {
        markdown: {
          serialize(state: MarkdownSerializerState, node: NodeType) {
            const label = node.attrs[EMentionComponentAttributeNames.ENTITY_NAME] ?? "user_mention";
            state.write(`@${label}`);
          },
        },
      };
    },
  }).configure({
    suggestion: {
      render: renderMentionsDropdown({
        searchCallback,
      }),
    },
  });
};
