import { ReactNodeViewRenderer } from "@tiptap/react";
// commands
import { externalEmbedCommands } from "./commands";
// components
import { ExternalEmbedNodeView } from "./components/node-view";
// config
import { ExternalEmbedExtensionConfig } from "./extension-config";
// plugins
import { createExternalEmbedPastePlugin } from "./plugins";
// types
import { ExternalEmbedExtensionStorage, ExternalEmbedProps } from "./types";
import { ExternalEmbedNodeViewProps } from "@/types";

export const ExternalEmbedExtension = (props: ExternalEmbedProps) =>
  ExternalEmbedExtensionConfig.extend({
    selectable: true,
    draggable: true,

    addOptions() {
      return {
        ...this.parent?.(),
        externalEmbedCallbackComponent: props?.widgetCallback,
        isFlagged: !!props?.isFlagged,
      };
    },

    addStorage(): ExternalEmbedExtensionStorage {
      return {
        posToInsert: { from: 0, to: 0 },
        url: "",
        openInput: false,
      };
    },

    addProseMirrorPlugins() {
      return [
        createExternalEmbedPastePlugin({
          isFlagged: this.options.isFlagged,
          editor: this.editor,
        }),
      ];
    },

    addCommands() {
      return externalEmbedCommands(this.type);
    },

    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <ExternalEmbedNodeView {...props} node={props.node as ExternalEmbedNodeViewProps["node"]} />
      ));
    },
  });
