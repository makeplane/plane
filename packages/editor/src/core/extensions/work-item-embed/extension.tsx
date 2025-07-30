import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
// local imports
import { WorkItemEmbedExtensionConfig } from "./extension-config";

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

export const WorkItemEmbedExtension = (props: Props) =>
  WorkItemEmbedExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer((issueProps: any) => (
        <NodeViewWrapper key={`work-item-embed-node-view-${issueProps.node.attrs.entity_identifier}`}>
          {props.widgetCallback({
            issueId: issueProps.node.attrs.entity_identifier,
            projectId: issueProps.node.attrs.project_identifier,
            workspaceSlug: issueProps.node.attrs.workspace_identifier,
          })}
        </NodeViewWrapper>
      ));
    },
  });
