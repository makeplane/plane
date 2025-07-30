import { mergeAttributes, Node } from "@tiptap/core";
import { EPageAccess } from "@plane/constants";

export type PageEmbedExtensionAttributes = {
  entity_identifier?: string;
  workspace_identifier?: string;
  locked?: boolean;
  archived?: boolean;
  access?: EPageAccess;
  id?: string;
  entity_name?: string;
};

export const PageEmbedExtensionConfig = Node.create({
  name: "pageEmbedComponent",
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
        default: "sub_page",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "page-embed-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["page-embed-component", mergeAttributes(HTMLAttributes)];
  },

  addStorage() {
    return {
      deletedPageSet: new Map<string, boolean>(),
    };
  },
});
