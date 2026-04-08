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

import type { NodeViewProps } from "@tiptap/core";
// version diff support
import { YChangeNodeViewWrapper } from "@/components/editors/version-diff/extensions/ychange-node-view-wrapper";

export type PiUtilityEmbedNodeViewProps = NodeViewProps;

export function PiUtilityEmbedNodeView(props: PiUtilityEmbedNodeViewProps) {
  const { node, extension } = props;
  const { widgetCallback } = extension.options;
  const embedId = node.attrs["data-embed-id"];

  if (!embedId) return null;
  return (
    <YChangeNodeViewWrapper
      decorations={props.decorations}
      className="pi-utility-embed-wrapper"
      contentEditable={false}
    >
      {widgetCallback({
        embedId,
        embedType: node.attrs["data-embed-type"],
        subType: node.attrs["data-sub-type"],
        title: node.attrs["data-title"],
      })}
    </YChangeNodeViewWrapper>
  );
}
