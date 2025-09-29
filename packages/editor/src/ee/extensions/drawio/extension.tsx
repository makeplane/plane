import { ReactNodeViewRenderer } from "@tiptap/react";
import { TFileHandler } from "@/types";
// commands
import { drawioCommands } from "./commands";
// components
import { DrawioNodeView, DrawioNodeViewProps } from "./components/node-view";
// config
import { DrawioExtensionConfig } from "./extension-config";

type DrawioProps = {
  onClick?: () => void;
  fileHandler: TFileHandler;
  isFlagged: boolean;
  logoSpinner?: React.ComponentType;
};
export const DrawioExtension = (props: DrawioProps) =>
  DrawioExtensionConfig.extend({
    addOptions() {
      const { fileHandler } = props;
      const { getAssetSrc, restore, getFileContent, upload, reupload } = fileHandler;

      return {
        ...this.parent?.(),
        onClick: props?.onClick,
        isFlagged: props.isFlagged,
        getDiagramSrc: getAssetSrc,
        getFileContent: getFileContent,
        restoreDiagram: restore,
        uploadDiagram: upload,
        reuploadDiagram: reupload,
        logoSpinner: props.logoSpinner,
      };
    },

    addStorage() {
      return {
        posToInsert: { from: 0, to: 0 },
        openDialog: false,
      };
    },

    addCommands() {
      return drawioCommands(this.type);
    },

    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <DrawioNodeView {...props} node={props.node as DrawioNodeViewProps["node"]} />
      ));
    },
  });
