import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

type Props = {
  widgetCallback: (issueId: string) => React.ReactNode;
};

export const IssueWidget = (props: Props) =>
  Node.create({
    name: "issue-embed-component",
    group: "block",
    atom: true,

    addAttributes() {
      return {
        entity_identifier: {
          default: undefined,
        },
        id: {
          default: undefined,
        },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((issueProps: any) => (
        <NodeViewWrapper>{props.widgetCallback(issueProps.node.attrs.entity_identifier)}</NodeViewWrapper>
      ));
    },

    parseHTML() {
      return [
        {
          tag: "issue-embed-component",
          getAttrs: (node: string | HTMLElement) => {
            if (typeof node === "string") {
              return null;
            }
            return {
              id: node.getAttribute("id") || "",
              title: node.getAttribute("title") || "",
              entity_name: node.getAttribute("entity_name") || "",
              entity_identifier: node.getAttribute("entity_identifier") || "",
              project_identifier: node.getAttribute("project_identifier") || "",
              sequence_id: node.getAttribute("sequence_id") || "",
            };
          },
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return ["issue-embed-component", mergeAttributes(HTMLAttributes)];
    },
  });
