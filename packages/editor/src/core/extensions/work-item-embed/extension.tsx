import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
// local imports
import { WorkItemEmbedExtensionConfig } from "./extension-config";
import type { TWorkItemEmbedAttributes } from "./types";
import { EWorkItemEmbedAttributeNames } from "./types";

type Props = {
  widgetCallback: ({
    issueId,
    projectId,
    workspaceSlug,
  }: {
    issueId: string;
    projectId: string | undefined;
    workspaceSlug: string | undefined;
  }) => React.ReactNode;
};

export function WorkItemEmbedExtension(props: Props) {
  return WorkItemEmbedExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer((issueProps: NodeViewProps) => {
        const attrs = issueProps.node.attrs as TWorkItemEmbedAttributes;
        return (
          <NodeViewWrapper key={attrs[EWorkItemEmbedAttributeNames.ID]}>
            {props.widgetCallback({
              issueId: attrs[EWorkItemEmbedAttributeNames.ENTITY_IDENTIFIER] ?? "",
              projectId: attrs[EWorkItemEmbedAttributeNames.PROJECT_IDENTIFIER],
              workspaceSlug: attrs[EWorkItemEmbedAttributeNames.WORKSPACE_IDENTIFIER],
            })}
          </NodeViewWrapper>
        );
      });
    },
  });
}
