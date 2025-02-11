import { ReactNodeViewRenderer } from "@tiptap/react";
// types
import { TMentionHandler } from "@/types";
// extension config
import { CustomMentionExtensionConfig } from "./extension-config";
// node view
import { MentionNodeView } from "./mention-node-view";
// utils
import { renderMentionsDropdown } from "./utils";

export const CustomMentionExtension = (props: TMentionHandler) => {
  const { searchCallback, renderComponent, getMentionComponentAttributes } = props;
  return CustomMentionExtensionConfig.extend({
    addOptions(this) {
      return {
        ...this.parent?.(),
        renderComponent,
        getMentionComponentAttributes,
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(MentionNodeView);
    },
  }).configure({
    suggestion: {
      render: renderMentionsDropdown({
        searchCallback,
      }),
    },
  });
};
