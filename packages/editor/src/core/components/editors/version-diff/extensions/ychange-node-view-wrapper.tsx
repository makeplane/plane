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

import type { Decoration } from "@tiptap/pm/view";
import type { NodeViewWrapperProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { cn } from "@plane/utils";
import { useYChangeDecorations } from "./use-ychange-decorations";

type YChangeNodeViewWrapperProps = Omit<NodeViewWrapperProps, "decorations"> & {
  decorations?: readonly Decoration[];
};

export function YChangeNodeViewWrapper(props: YChangeNodeViewWrapperProps) {
  const { decorations, className, style, children, ...rest } = props;
  const ychangeInfo = useYChangeDecorations(decorations);

  return (
    <NodeViewWrapper
      className={cn(className, ychangeInfo.className)}
      style={{ ...ychangeInfo.style, ...(style as React.CSSProperties) }}
      {...ychangeInfo.dataAttrs}
      {...rest}
    >
      {children}
    </NodeViewWrapper>
  );
}
