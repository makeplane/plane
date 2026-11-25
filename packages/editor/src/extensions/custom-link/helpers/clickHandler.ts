/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// local imports
import { isDangerousHref } from "../extension";

type ClickHandlerOptions = {
  type: MarkType;
};

export function clickHandler(_options: ClickHandlerOptions): Plugin {
  return new Plugin({
    key: new PluginKey("handleClickLink"),
    props: {
      handleClick: (view, pos, event) => {
        if (event.button !== 0) {
          return false;
        }

        // the click can land on an element inside the anchor, so resolve the anchor itself
        const link = (event.target as Element | null)?.closest("a");

        if (!link || !view.dom.contains(link)) {
          return false;
        }

        // only the clicked anchor's browser-resolved URL is opened, never the mark attribute from the editor state
        const href = link.href;

        if (href) {
          // Defence-in-depth: link.href is the browser-resolved URL (whitespace
          // already stripped by the browser's WHATWG URL parser), so a protocol
          // check here is sufficient to catch any dangerous URI that slipped past
          // the editor's parse/render-time guards. Matches the blocked-scheme list
          // in isValidHttpUrl (javascript:, data:, vbscript:, file:, about:)
          // to keep the policy consistent (GHSA-v2vv-7wq3-8w2j).
          if (isDangerousHref(href) || /^(file|about):/i.test(href)) {
            return false;
          }

          // Stop the native anchor navigation, otherwise read-only (non-editable)
          // views open the link twice: once here and once via the <a target="_blank">.
          event.preventDefault();
          // the target attribute is stored content: only _self is honoured, anything else opens a new tab
          window.open(href, link.target === "_self" ? "_self" : "_blank", "noopener,noreferrer");

          return true;
        }

        return false;
      },
    },
  });
}
