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
// plane utils
import { cn } from "@plane/ui";
// types
import type { TExternalEmbedBlockAttributes } from "@/types";
// components
import type { ExternalEmbedExtension } from "../types";
import { ExternalEmbedBlock } from "./block";

export type ExternalEmbedNodeViewProps = Omit<NodeViewProps, "extension"> & {
  extension: ExternalEmbedExtension;
  node: NodeViewProps["node"] & {
    attrs: TExternalEmbedBlockAttributes;
  };
  updateAttributes: (attrs: Partial<TExternalEmbedBlockAttributes>) => void;
};

export function ExternalEmbedNodeView(props: ExternalEmbedNodeViewProps) {
  const { decorations, editor, extension, node, selected } = props;
  const ExternalEmbedComponent = extension.options.externalEmbedCallbackComponent;
  const isTouchDevice = !!editor.storage.utility.isTouchDevice;

  return (
    <YChangeNodeViewWrapper
      decorations={decorations}
      className={cn("editor-embed-component relative", {
        "touch-select-none": isTouchDevice,
      })}
      contentEditable={false}
    >
      {!node.attrs.src || node.attrs.src.trim() === "" ? (
        <ExternalEmbedBlock {...props} />
      ) : (
        <div className="relative" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <ExternalEmbedComponent {...props} />
          {selected && (
            <div className="absolute inset-0 size-full bg-accent-primary/30 pointer-events-none rounded-md" />
          )}
        </div>
      )}
    </YChangeNodeViewWrapper>
  );
}
