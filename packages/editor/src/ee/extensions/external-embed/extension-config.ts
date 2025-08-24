import { mergeAttributes, Node } from "@tiptap/core";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
import type { ExternalEmbedExtension, InsertExternalEmbedCommandProps } from "./types";
// utils
import { DEFAULT_EXTERNAL_EMBED_ATTRIBUTES } from "./utils/attribute";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED]: {
      insertExternalEmbed: (props: InsertExternalEmbedCommandProps) => ReturnType;
    };
  }
}

export const ExternalEmbedExtensionConfig: ExternalEmbedExtension = Node.create({
  name: ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED,
  group: "block",
  atom: true,
  isolating: true,
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    const attributes = {
      ...Object.values(EExternalEmbedAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_EXTERNAL_EMBED_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };
    return attributes;
  },

  parseHTML() {
    return [
      {
        tag: "external-embed",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["external-embed", mergeAttributes(HTMLAttributes)];
  },
});
