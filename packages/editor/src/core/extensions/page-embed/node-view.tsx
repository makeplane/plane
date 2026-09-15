/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
// extension config
import type { TPageEmbedExtensionOptions } from "./extension-config";
// extension types
import type { TPageEmbedComponentAttributes } from "./types";
import { EPageEmbedAttributeNames } from "./types";

export type PageEmbedNodeViewProps = NodeViewProps & {
  node: NodeViewProps["node"] & {
    attrs: TPageEmbedComponentAttributes;
  };
};

export function PageEmbedNodeView(props: PageEmbedNodeViewProps) {
  const {
    extension,
    node: { attrs },
  } = props;

  return (
    <NodeViewWrapper key={attrs[EPageEmbedAttributeNames.ID]} className="page-embed-component inline w-fit">
      {(extension.options as TPageEmbedExtensionOptions).widgetCallback({
        pageId: attrs[EPageEmbedAttributeNames.ENTITY_IDENTIFIER] ?? "",
        projectId: attrs[EPageEmbedAttributeNames.PROJECT_IDENTIFIER] ?? undefined,
        workspaceSlug: attrs[EPageEmbedAttributeNames.WORKSPACE_IDENTIFIER] ?? undefined,
      })}
    </NodeViewWrapper>
  );
}
