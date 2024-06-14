import { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface ImageNode extends ProseMirrorNode {
  attrs: {
    src: string;
    id: string;
  };
}

export type ImageExtensionStorage = {
  deletedImageSet: Map<string, boolean>;
  uploadInProgress: boolean;
};
