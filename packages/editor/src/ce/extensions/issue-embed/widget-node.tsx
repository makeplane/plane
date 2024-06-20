import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
// components
import { IssueWidgetCard } from "@/plane-editor/extensions";

export const IssueWidget = Node.create({
  name: "issue-embed-component",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      id: {
        default: null,
      },
      class: {
        default: "w-[600px]",
      },
      title: {
        default: null,
      },
      entity_name: {
        default: null,
      },
      entity_identifier: {
        default: null,
      },
      project_identifier: {
        default: null,
      },
      sequence_id: {
        default: null,
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer((props: object) => <IssueWidgetCard {...props} />);
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
