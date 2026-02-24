/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import type { TFileHandler } from "@/types";
// commands
import { drawioCommands } from "./commands";
// components
import type { DrawioNodeViewProps } from "./components/node-view";
import { DrawioNodeView } from "./components/node-view";
// config
import { DrawioExtensionConfig } from "./extension-config";

type DrawioProps = {
  onClick?: () => void;
  fileHandler: TFileHandler;
  isFlagged: boolean;
  logoSpinner?: React.ComponentType;
};

export function DrawioExtension(props: DrawioProps) {
  return DrawioExtensionConfig.extend({
    addOptions() {
      const { fileHandler } = props;
      const { restore, getFileContent, upload, reupload, getAssetSrc } = fileHandler;
      const duplicate = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;

      return {
        ...this.parent?.(),
        onClick: props?.onClick,
        isFlagged: props.isFlagged,
        getDiagramSrc: getAssetSrc,
        getFileContent,
        restoreDiagram: restore,
        uploadDiagram: upload,
        reuploadDiagram: reupload,
        duplicateDiagram: duplicate,
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
}
