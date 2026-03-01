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

import type { RawCommands } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
import { v4 as uuidv4 } from "uuid";
import type { TDrawioBlockAttributes } from "./types";
import { EDrawioAttributeNames } from "./types";
import { DEFAULT_DRAWIO_ATTRIBUTES } from "./utils/attribute";
// constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";

export const drawioCommands = (nodeType: NodeType): Partial<RawCommands> => ({
  insertDrawioDiagram:
    (props) =>
    ({ commands, editor }) => {
      const uniqueID = uuidv4();

      const attributes: TDrawioBlockAttributes = {
        ...DEFAULT_DRAWIO_ATTRIBUTES,
        [EDrawioAttributeNames.ID]: uniqueID,
        [EDrawioAttributeNames.MODE]: props.mode,
      };

      // Set flag to auto-open the modal when component mounts
      const drawioStorage = editor.storage[ADDITIONAL_EXTENSIONS.DRAWIO];
      if (drawioStorage) {
        drawioStorage.openDialog = true;
      }

      if (props.pos) {
        commands.insertContentAt(props.pos, {
          type: nodeType.name,
          attrs: attributes,
        });
      } else {
        commands.insertContent({
          type: nodeType.name,
          attrs: attributes,
        });
      }

      return true;
    },
});
