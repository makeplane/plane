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

import type { JSONContent } from "@tiptap/core";
import { Editor, Extension } from "@tiptap/core";
// local imports
import { PQLHighlighterPlugin } from "./plugins/highlighter-plugin";
import { PQLAutocompletePlugin } from "./plugins/autocomplete-plugin";
import { PQLKeymapPlugin } from "./plugins/keymap-plugin";
import type { FieldDef, ParseResult, SuggestionContext, DropdownState } from "./types";

export type PQLEditorExtensionOptions = {
  /**
   * Custom field definitions. Falls back to the built-in FIELD_DEFS registry
   * when not provided. Pass a custom array to support project-specific fields.
   */
  fieldDefs: FieldDef[];
  /** Called whenever the document changes with the latest parse result */
  onParseResult: (result: ParseResult) => void;
  /** Called whenever the cursor moves to a position that has autocomplete candidates */
  onContextChange: (args: {
    editor: Editor;
    context: SuggestionContext | null;
    newAnchor: { top: number; left: number; bottom: number } | null;
  }) => void;
  /** Called when the user presses Enter in single-line mode with no dropdown open */
  onSubmit?: (val: { json: JSONContent; text: string }) => void;
  /** Returns the current dropdown state (avoids passing a React ref object) */
  getDropdownState: () => DropdownState;
  /** Wired from React — move autocomplete selection up or down */
  onDropdownNavigate: (direction: "up" | "down") => void;
  /** Wired from React — accept the currently highlighted autocomplete item */
  onDropdownAccept: (editor: Editor) => void;
  /** Wired from React — close the autocomplete dropdown */
  onDropdownClose: () => void;
};

/**
 * Tiptap extension that turns any plain-text editor into a PQL query editor.
 *
 * Registers three ProseMirror plugins:
 *   1. PQLHighlighterPlugin  — syntax highlighting via Decoration spans
 *   2. PQLAutocompletePlugin — cursor context analysis, fires onContextChange
 *   3. PQLKeymapPlugin       — keyboard navigation for the autocomplete dropdown
 */
export const PQLEditorExtension = Extension.create<PQLEditorExtensionOptions>({
  name: "pqlEditor",

  addOptions() {
    return {
      fieldDefs: [],
      onParseResult: () => {},
      onContextChange: () => {},
      onSubmit: undefined,
      getDropdownState: () => ({ isOpen: false, activeIndex: 0, suggestions: [] }),
      onDropdownNavigate: () => {},
      onDropdownAccept: () => {},
      onDropdownClose: () => {},
    };
  },

  addProseMirrorPlugins() {
    return [
      PQLHighlighterPlugin({
        onParseResult: this.options.onParseResult,
        fieldDefs: this.options.fieldDefs,
      }),
      PQLAutocompletePlugin({
        onContextChange: (context, anchor) =>
          this.options.onContextChange({
            editor: this.editor,
            context,
            newAnchor: anchor,
          }),
      }),
      PQLKeymapPlugin({
        editor: this.editor,
        onSubmit: this.options.onSubmit,
        getDropdownState: this.options.getDropdownState,
        onDropdownNavigate: this.options.onDropdownNavigate,
        onDropdownAccept: () => this.options.onDropdownAccept(this.editor),
        onDropdownClose: this.options.onDropdownClose,
      }),
    ];
  },
});
