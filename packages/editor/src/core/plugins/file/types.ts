import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export type TFileNode = ProseMirrorNode & {
  attrs: {
    src: string;
    id: string;
  };
};
