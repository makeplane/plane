/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { getAttributes } from "@tiptap/core";
import type { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

type ClickHandlerOptions = {
  type: MarkType;
};

export function clickHandler(options: ClickHandlerOptions): Plugin {
  return new Plugin({
    key: new PluginKey("handleClickLink"),
    props: {
      handleClick: (view, pos, event) => {
        if (event.button !== 0) {
          return false;
        }

        const eventTarget = event.target as HTMLElement | null;
        const link = eventTarget?.closest?.("a") as HTMLLinkElement | null;

        if (!link || !view.dom.contains(link)) {
          return false;
        }

        const attrs = getAttributes(view.state, options.type.name);
        const href = link.href ?? attrs.href;
        const target = link.target ?? attrs.target;

        if (!href) {
          return false;
        }

        // Defence-in-depth: link.href is the browser-resolved URL (whitespace
        // already stripped by the browser's WHATWG URL parser), so a protocol
        // check here is sufficient to catch any dangerous URI that slipped past
        // the editor's parse/render-time guards. Matches the blocked-scheme list
        // in isValidHttpUrl (javascript:, data:, vbscript:, file:, about:)
        // to keep the policy consistent (GHSA-v2vv-7wq3-8w2j).
        if (/^(javascript|data|vbscript|file|about):/i.test(href)) {
          event.preventDefault();
          return true;
        }

        if (!view.editable) {
          return false;
        }

        window.open(href, target);

        return true;
      },
    },
  });
}
