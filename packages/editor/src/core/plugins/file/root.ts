/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import type { Plugin } from "@tiptap/pm/state";
// types
import type { TFileHandler } from "@/types";
// local imports
import { TrackFileDeletionPlugin } from "./delete";
import { TrackFileRestorationPlugin } from "./restore";

type TArgs = {
  editor: Editor;
  fileHandler: TFileHandler;
  isEditable: boolean;
};

export const FilePlugins = (args: TArgs): Plugin[] => {
  const { editor, fileHandler, isEditable } = args;

  return [
    ...(isEditable && "delete" in fileHandler ? [TrackFileDeletionPlugin(editor, fileHandler.delete)] : []),
    TrackFileRestorationPlugin(editor, fileHandler.restore),
  ];
};
