import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// extension config
import { TMentionExtensionOptions } from "./extension-config";
// extension types
import { EMentionComponentAttributeNames, TMentionComponentAttributes } from "./types";

type Props = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TMentionComponentAttributes;
  };
};

export const MentionNodeView = (props: Props) => {
  const {
    extension,
    node: { attrs },
  } = props;
  return (
    <NodeViewWrapper className="mention-component inline w-fit">
      {(extension.options as TMentionExtensionOptions).renderComponent({
        entity_identifier: attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER],
        entity_name: attrs[EMentionComponentAttributeNames.ENTITY_NAME] ?? "user_mention",
      })}
    </NodeViewWrapper>
  );
};
