import { ReactNodeViewRenderer } from "@tiptap/react";
// types
import { TMentionHandler } from "@/types";
// extension config
import { CustomMentionExtensionConfig } from "./extension-config";
// node view
import { MentionNodeView, MentionNodeViewProps } from "./mention-node-view";
// utils
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
      return ReactNodeViewRenderer((props) => (
        <MentionNodeView {...props} node={props.node as MentionNodeViewProps["node"]} />
      ));
    },
  }).configure({
    suggestion: {
      render: renderMentionsDropdown({
        searchCallback,
      }),
    },
  });
};
