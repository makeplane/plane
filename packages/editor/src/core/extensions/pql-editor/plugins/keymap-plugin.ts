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

import type { Editor, JSONContent } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// local imports
import type { DropdownState } from "../types";

// ─── Plugin key ───────────────────────────────────────────────────────────────

export const PQL_KEYMAP_KEY = new PluginKey("pqlKeymap");

export type PQLKeymapOptions = {
  editor: Editor;
  onSubmit?: (value: { json: JSONContent; text: string }) => void;
  /** Returns the current dropdown state without holding a React ref object. */
  getDropdownState: () => DropdownState;
  onDropdownNavigate: (direction: "up" | "down") => void;
  onDropdownAccept: () => void;
  onDropdownClose: () => void;
};

export function PQLKeymapPlugin(options: PQLKeymapOptions): Plugin {
  return new Plugin({
    key: PQL_KEYMAP_KEY,

    props: {
      handleKeyDown(_view, event): boolean {
        const { editor, getDropdownState, onDropdownNavigate, onDropdownAccept, onDropdownClose, onSubmit } = options;
        const dropdown = getDropdownState();

        switch (event.key) {
          case "ArrowDown":
            if (dropdown.isOpen) {
              event.preventDefault();
              onDropdownNavigate("down");
              return true;
            }
            return false;

          case "ArrowUp":
            if (dropdown.isOpen) {
              event.preventDefault();
              onDropdownNavigate("up");
              return true;
            }
            return false;

          case "Tab":
            if (dropdown.isOpen) {
              event.preventDefault();
              onDropdownAccept();
              return true;
            }
            return false;

          case "Enter":
            if (dropdown.isOpen) {
              event.preventDefault();
              onDropdownAccept();
              return true;
            }
            if (onSubmit) {
              event.preventDefault();
              onSubmit({
                json: editor.getJSON(),
                text: editor.getText(),
              });
              return true;
            }
            return false;
          case "Escape":
            if (dropdown.isOpen) {
              event.preventDefault();
              onDropdownClose();
              return true;
            }
            return false;

          default:
            return false;
        }
      },
    },
  });
}
