import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
// extension config
import type { TMentionExtensionOptions } from "./extension-config";
// extension types
import type { TMentionComponentAttributes } from "./types";
import { EMentionComponentAttributeNames } from "./types";

export type MentionNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TMentionComponentAttributes;
  };
};

export function MentionNodeView(props: MentionNodeViewProps) {
  const {
    extension,
    node: { attrs },
  } = props;

  return (
    <NodeViewWrapper className="mention-component inline w-fit" key={`mention-${attrs.id}`}>
      {(extension.options as TMentionExtensionOptions).renderComponent({
        entity_identifier: attrs[EMentionComponentAttributeNames.ENTITY_IDENTIFIER] ?? "",
        entity_name: attrs[EMentionComponentAttributeNames.ENTITY_NAME] ?? "user_mention",
      })}
    </NodeViewWrapper>
  );
}
