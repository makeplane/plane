import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import { mergeAttributes, Node } from "@tiptap/core";


export const PageLinkExtensionConfig = Node.create({
  name: ADDITIONAL_EXTENSIONS.PAGE_LINK_COMPONENT,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      entity_identifier: {
        default: undefined,
      },
      workspace_identifier: {
        default: undefined,
      },
      id: {
        default: undefined,
      },
      entity_name: {
        default: "page_link",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "page-link-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["page-link-component", mergeAttributes(HTMLAttributes)];
  },
});
