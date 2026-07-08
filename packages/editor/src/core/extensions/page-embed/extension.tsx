/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
// local imports
import { PageEmbedExtensionConfig } from "./extension-config";
import { EPageEmbedAttributeNames } from "./types";
import type { TPageEmbedAttributes, TPageEmbedWidgetCallback } from "./types";

type Props = {
  widgetCallback?: TPageEmbedWidgetCallback;
};

export function PageEmbedExtension(props: Props) {
  return PageEmbedExtensionConfig.extend({
    addNodeView() {
      return ReactNodeViewRenderer((nodeProps: NodeViewProps) => {
        const attrs = nodeProps.node.attrs as TPageEmbedAttributes;
        const pageId = attrs[EPageEmbedAttributeNames.PAGE_ID] ?? "";
        const pageTitle = attrs[EPageEmbedAttributeNames.PAGE_TITLE] ?? "";
        return (
          <NodeViewWrapper key={pageId}>
            {props.widgetCallback ? (
              props.widgetCallback({ pageId, pageTitle })
            ) : (
              <span className="text-secondary">{pageTitle || "Page"}</span>
            )}
          </NodeViewWrapper>
        );
      });
    },
  });
}
