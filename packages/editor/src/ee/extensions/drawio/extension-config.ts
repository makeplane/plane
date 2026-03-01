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

import { mergeAttributes, Node } from "@tiptap/core";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
//types
import { EDrawioAttributeNames } from "./types";
import type {
  TDrawioBlockAttributes,
  TDrawioExtension,
  InsertDrawioCommandProps,
  DrawioExtensionStorage,
} from "./types";
// utils
import { DEFAULT_DRAWIO_ATTRIBUTES } from "./utils/attribute";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.DRAWIO]: {
      /**
       * Insert a drawio diagram
       */
      insertDrawioDiagram: (props: InsertDrawioCommandProps) => ReturnType;
    };
  }

  interface Storage {
    [ADDITIONAL_EXTENSIONS.DRAWIO]: DrawioExtensionStorage;
  }
}

export const DrawioExtensionConfig: TDrawioExtension = Node.create({
  name: ADDITIONAL_EXTENSIONS.DRAWIO,
  group: "block",
  atom: true,
  isolating: true,
  defining: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    const attributes = {
      ...Object.values(EDrawioAttributeNames).reduce(
        (acc, value) => {
          acc[value] = {
            default: DEFAULT_DRAWIO_ATTRIBUTES[value],
          };
          return acc;
        },
        {} as Record<keyof TDrawioBlockAttributes, { default: TDrawioBlockAttributes[keyof TDrawioBlockAttributes] }>
      ),
    };
    return attributes;
  },
  parseHTML() {
    return [
      {
        tag: "drawio-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["drawio-component", mergeAttributes(HTMLAttributes)];
  },
});
