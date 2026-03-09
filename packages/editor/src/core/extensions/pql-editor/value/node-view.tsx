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
import { NodeViewWrapper } from "@tiptap/react";
// local imports
import type { PQLValueExtensionAttributes } from "./types";

export type PQLValueNodeViewProps = Omit<NodeViewProps, "updateAttributes"> & {
  node: NodeViewProps["node"] & {
    attrs: PQLValueExtensionAttributes;
  };
  updateAttributes: (attrs: Partial<PQLValueExtensionAttributes>) => void;
};

export function PQLValueNodeView(props: PQLValueNodeViewProps) {
  const { node } = props;
  // attributes
  const { option } = node.attrs;

  if (!option) return null;

  return (
    <NodeViewWrapper className="inline-flex max-w-full rounded-sm bg-label-grey-bg py-1 px-1.5 text-caption-md-medium text-secondary">
      {option.label}
    </NodeViewWrapper>
  );
}
