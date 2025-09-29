import { mergeAttributes, Node } from "@tiptap/core";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
//types
import {
  EDrawioAttributeNames,
  TDrawioBlockAttributes,
  type TDrawioExtension,
  type InsertDrawioCommandProps,
} from "./types";
// utils
import { DEFAULT_DRAWIO_ATTRIBUTES } from "./utils/attribute";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.DRAWIO]: {
      /**
       * Insert a drawio diagram
       */
      insertDrawioDiagram: (props: InsertDrawioCommandProps) => ReturnType;
    };
  }
}

export const DrawioExtensionConfig: TDrawioExtension = Node.create({
  name: ADDITIONAL_EXTENSIONS.DRAWIO,
  group: "block",
  atom: true,
  isolating: true,
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    const attributes = {
      ...Object.values(EDrawioAttributeNames).reduce(
        (acc, value) => {
          acc[value] = {
            default: DEFAULT_DRAWIO_ATTRIBUTES[value],
          };
          return acc;
        },
        {} as Record<keyof TDrawioBlockAttributes, { default: TDrawioBlockAttributes[keyof TDrawioBlockAttributes] }>
      ),
    };
    return attributes;
  },
  parseHTML() {
    return [
      {
        tag: "drawio-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["drawio-component", mergeAttributes(HTMLAttributes)];
  },
});
