import { mergeAttributes, Node } from "@tiptap/core";

export const IssueWidgetWithoutProps = () =>
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
