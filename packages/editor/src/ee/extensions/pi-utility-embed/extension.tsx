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
// types
import type { TPiUtilityEmbedConfig } from "@/types";
// local imports
import { PiUtilityEmbedNodeView } from "./components/node-view";
import { PiUtilityEmbedExtensionConfig } from "./extension-config";

type PiUtilityEmbedExtensionProps = {
  widgetCallback?: TPiUtilityEmbedConfig["widgetCallback"];
};

export function PiUtilityEmbedExtension(props?: PiUtilityEmbedExtensionProps) {
  return PiUtilityEmbedExtensionConfig.extend({
    selectable: true,
    draggable: true,

    addOptions() {
      return {
        ...this.parent?.(),
        widgetCallback: props?.widgetCallback,
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(PiUtilityEmbedNodeView);
    },
  });
}
