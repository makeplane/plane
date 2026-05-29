import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

export const WorkItemEmbedExtensionConfig = Node.create({
  name: CORE_EXTENSIONS.WORK_ITEM_EMBED,
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
