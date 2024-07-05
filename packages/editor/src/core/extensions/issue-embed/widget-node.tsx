import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

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

export const IssueWidget = (props: Props) =>
  Node.create({
    name: "issue-embed-component",
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
      return {
        entity_identifier: {
          default: undefined,
        },
        project_identifier: {
          default: undefined,
        },
        workspace_identifier: {
          default: undefined,
        },
        id: {
          default: undefined,
        },
        entity_name: {
          default: undefined,
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((issueProps: any) => (
        <NodeViewWrapper>
          {props.widgetCallback({
            issueId: issueProps.node.attrs.entity_identifier,
            projectId: issueProps.node.attrs.project_identifier,
            workspaceSlug: issueProps.node.attrs.workspace_identifier,
          })}
        </NodeViewWrapper>
      ));
    },

    parseHTML() {
      return [
        {
          tag: "issue-embed-component",
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["issue-embed-component", mergeAttributes(HTMLAttributes)];
    },
  });
