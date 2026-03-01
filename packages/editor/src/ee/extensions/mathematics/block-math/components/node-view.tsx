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

import type { NodeViewProps } from "@tiptap/react";
// plane utils
import { cn } from "@plane/utils";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// types
import type { TMathAttributes } from "../../types";
// local types
import type { BlockMathExtensionType } from "../types";
// local components
import { BlockMathBlock } from "./block-math-block";

export type BlockMathNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: BlockMathExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TMathAttributes;
  };
  updateAttributes: (attrs: Partial<TMathAttributes>) => void;
};

export function BlockMathNodeView(props: BlockMathNodeViewProps) {
  const { decorations, getPos, editor, node, extension, selected } = props;

  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className={cn("block-math-component editor-mathematics-component relative", {
        "cursor-pointer": editor.isEditable,
        "touch-select-none": isTouchDevice,
      })}
      contentEditable={false}
    >
      <BlockMathBlock node={node} editor={editor} getPos={getPos} extension={extension} selected={selected} />
    </YChangeNodeViewWrapper>
  );
}
