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

import { Extension } from "@tiptap/core";
// helpers
import { CORE_EXTENSIONS } from "@/constants/extension";
import { restorePublicImages } from "@/helpers/image-helpers";
// plugins
import type { TAdditionalActiveDropbarExtensions } from "@/plane-editor/types/utils";
import { DropHandlerPlugin } from "@/plugins/drop";
import { DropCursorPlugin } from "@/plugins/drop-cursor";
import { FilePlugins } from "@/plugins/file/root";
import { NodeHighlightPlugin } from "@/plugins/highlight";
import { MarkdownClipboardPlugin } from "@/plugins/markdown-clipboard";
import type { IEditorProps, TEditorAsset, TFileHandler } from "@/types";
import { codemark } from "./code-mark";

type TActiveDropbarExtensions =
  | CORE_EXTENSIONS.MENTION
  | CORE_EXTENSIONS.EMOJI
  | CORE_EXTENSIONS.SLASH_COMMANDS
  | CORE_EXTENSIONS.TABLE
  | "bubble-menu"
  | CORE_EXTENSIONS.SIDE_MENU
  | TAdditionalActiveDropbarExtensions;

declare module "@tiptap/core" {
  interface Commands {
    [CORE_EXTENSIONS.UTILITY]: {
      updateAssetsUploadStatus: (updatedStatus: TFileHandler["assetsUploadStatus"]) => () => void;
      updateAssetsList: (
        args:
          | {
              asset: TEditorAsset;
            }
          | {
              idToRemove: string;
            }
      ) => () => void;
      addActiveDropbarExtension: (extension: TActiveDropbarExtensions) => () => void;
      removeActiveDropbarExtension: (extension: TActiveDropbarExtensions) => () => void;
    };
  }
  interface Storage {
    [CORE_EXTENSIONS.UTILITY]: UtilityExtensionStorage;
  }
}

export type UtilityExtensionStorage = {
  assetsList: TEditorAsset[];
  assetsUploadStatus: TFileHandler["assetsUploadStatus"];
  uploadInProgress: boolean;
  activeDropbarExtensions: TActiveDropbarExtensions[];
  isTouchDevice: boolean;
};

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions" | "getEditorMetaData"> & {
  fileHandler: TFileHandler;
  isEditable: boolean;
  isTouchDevice: boolean;
};

export const UtilityExtension = (props: Props) => {
  const { disabledExtensions, flaggedExtensions, fileHandler, getEditorMetaData, isEditable, isTouchDevice } = props;
  const { restore } = fileHandler;

  return Extension.create<Record<string, unknown>, UtilityExtensionStorage>({
    name: CORE_EXTENSIONS.UTILITY,
    priority: 1000,

    addProseMirrorPlugins() {
      return [
        ...FilePlugins({
          editor: this.editor,
          isEditable,
          fileHandler,
        }),
        ...codemark({ markType: this.editor.schema.marks.code }),
        MarkdownClipboardPlugin({
          editor: this.editor,
          getEditorMetaData,
        }),
        DropHandlerPlugin({
          disabledExtensions,
          flaggedExtensions,
          editor: this.editor,
        }),
        DropCursorPlugin({
          color: false,
          class:
            "text-custom-text-300 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none duration-100 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)]",
          isMultiColumnFlagged: !!flaggedExtensions?.includes("multi-column"),
        }),
        NodeHighlightPlugin(),
      ];
    },

    onCreate() {
      restorePublicImages(this.editor, restore);
    },

    addStorage() {
      return {
        assetsList: [],
        assetsUploadStatus: isEditable && "assetsUploadStatus" in fileHandler ? fileHandler.assetsUploadStatus : {},
        uploadInProgress: false,
        activeDropbarExtensions: [],
        isTouchDevice,
      };
    },

    addCommands() {
      return {
        updateAssetsUploadStatus: (updatedStatus) => () => {
          this.storage.assetsUploadStatus = updatedStatus;
        },
        updateAssetsList: (args) => () => {
          const uniqueAssets = new Set(this.storage.assetsList);
          if ("asset" in args) {
            const alreadyExists = this.storage.assetsList.find((asset) => asset.id === args.asset.id);
            if (!alreadyExists) {
              uniqueAssets.add(args.asset);
            }
          } else if ("idToRemove" in args) {
            const asset = this.storage.assetsList.find((asset) => asset.id === args.idToRemove);
            if (asset) {
              uniqueAssets.delete(asset);
            }
          }
          this.storage.assetsList = Array.from(uniqueAssets);
        },
        addActiveDropbarExtension: (extension) => () => {
          const index = this.storage.activeDropbarExtensions.indexOf(extension);
          if (index === -1) {
            this.storage.activeDropbarExtensions.push(extension);
          }
        },
        removeActiveDropbarExtension: (extension) => () => {
          const index = this.storage.activeDropbarExtensions.indexOf(extension);
          if (index !== -1) {
            this.storage.activeDropbarExtensions.splice(index, 1);
          }
        },
      };
    },
  });
};
