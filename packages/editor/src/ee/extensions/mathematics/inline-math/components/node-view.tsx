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
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";
// types
import type { TMathAttributes } from "../../types";
// local types
import type { InlineMathExtensionType } from "../types";
// local components
import { InlineMathBlock } from "./inline-math-block";

export type InlineMathNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: InlineMathExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TMathAttributes;
  };
  updateAttributes: (attrs: Partial<TMathAttributes>) => void;
};

export function InlineMathNodeView(props: InlineMathNodeViewProps) {
  const { decorations, getPos, editor, node, extension } = props;

  return (
    <YChangeNodeViewWrapper
      as="span"
      decorations={decorations}
      className={editor.isEditable ? "cursor-pointer" : ""}
      contentEditable={false}
    >
      <InlineMathBlock node={node} editor={editor} getPos={getPos} extension={extension} />
    </YChangeNodeViewWrapper>
  );
}
