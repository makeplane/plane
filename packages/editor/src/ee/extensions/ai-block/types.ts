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

import type { Extension, Node as ProseMirrorNode } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import type { TAIBlockHandlers, TAIBlockType, TAIBlockDetails } from "@plane/types";

export enum EAIBlockAttributeNames {
  ID = "data-id",
}

export type TAIBlockAttributes = {
  [EAIBlockAttributeNames.ID]: string | null;
};

// Data props that will be passed to the UI component
export type TAIBlockWidgetProps = {
  blockTypes?: TAIBlockType[];
  blocks?: TAIBlockDetails[];
};

// Forward declaration of extension props (to avoid circular dependency)
export type CustomAIBlockExtensionProps = {
  aiBlockHandlers?: TAIBlockHandlers;
  aiBlockWidgetCallback?: React.ComponentType<TAIBlockNodeViewProps>;
  isFlagged?: boolean;
};

// Node view props passed to the widget callback
export type TAIBlockNodeViewProps = Omit<NodeViewProps, "extension"> & {
  node: NodeViewProps["node"] & {
    attrs: TAIBlockAttributes;
  };
  extension: Extension<CustomAIBlockExtensionProps>;
  updateAttributes: (attrs: Partial<TAIBlockAttributes>) => void;
};

export type CustomAIBlockExtensionStorage = Record<string, never>;

export type CustomAIBlockExtensionType = ProseMirrorNode<CustomAIBlockExtensionProps, CustomAIBlockExtensionStorage>;
