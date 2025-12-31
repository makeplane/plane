import { ReactNodeViewRenderer } from "@tiptap/react";
import { LinkEmbedExtensionConfig } from "./extension-config";
import { LinkEmbedPreview } from "./preview-component";

export const LinkEmbedExtension = () =>
  LinkEmbedExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer(LinkEmbedPreview);
    },
  });
