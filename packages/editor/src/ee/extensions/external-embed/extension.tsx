import { ReactNodeViewRenderer } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// types
import { ExternalEmbedNodeViewProps } from "@/types";
// commands
import { externalEmbedCommands } from "./commands";
// components
import { ExternalEmbedNodeView } from "./components/node-view";
// config
import { ExternalEmbedExtensionConfig } from "./extension-config";
// plugins
import { createExternalEmbedPastePlugin } from "./plugins";
// editor types
import { ExternalEmbedExtensionStorage, ExternalEmbedProps } from "./types";

export const ExternalEmbedExtension = (props: ExternalEmbedProps) =>
  ExternalEmbedExtensionConfig.extend({
    selectable: true,
    draggable: true,

    addOptions() {
      return {
        ...this.parent?.(),
        externalEmbedCallbackComponent: props?.widgetCallback,
        isFlagged: !!props?.isFlagged,
        onClick: props?.onClick,
      };
    },

    addStorage(): ExternalEmbedExtensionStorage {
      return {
        posToInsert: { from: 0, to: 0 },
        url: "",
        openInput: false,
        isPasteDialogOpen: false,
      };
    },

    addProseMirrorPlugins() {
      const isTouchDevice = !!getExtensionStorage(this.editor, CORE_EXTENSIONS.UTILITY).isTouchDevice;
      if (isTouchDevice) {
        return [];
      }
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
