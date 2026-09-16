/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
// types
import type { TPageEmbedHandler } from "@/types";
// local imports
import { PageEmbedExtensionConfig } from "./extension-config";
import type { PageEmbedNodeViewProps } from "./node-view";
import { PageEmbedNodeView } from "./node-view";
import { renderPageEmbedDropdown } from "./utils";

export const PAGE_EMBED_TRIGGER_CHAR = "+";
// must differ from the mention extension's default "mention" key, otherwise the two suggestion plugins collide
export const PageEmbedSuggestionPluginKey = new PluginKey("page-embed-suggestion");

export function PageEmbedExtension(props: TPageEmbedHandler) {
  const { searchCallback, widgetCallback, onCreate } = props;
  return PageEmbedExtensionConfig.extend({
    addOptions(this) {
      return {
        ...this.parent?.(),
        widgetCallback,
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <PageEmbedNodeView {...props} node={props.node as unknown as PageEmbedNodeViewProps["node"]} />
      ));
    },
  }).configure({
    suggestion: {
      char: PAGE_EMBED_TRIGGER_CHAR,
      pluginKey: PageEmbedSuggestionPluginKey,
      render: renderPageEmbedDropdown({ searchCallback, onCreate }),
      allowSpaces: true,
    },
  });
}
