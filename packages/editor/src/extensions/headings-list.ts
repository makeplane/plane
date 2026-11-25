/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { IMarking } from "@/types";

export type HeadingExtensionStorage = {
  headings: IMarking[];
};

declare module "@tiptap/core" {
  interface Storage {
    [CORE_EXTENSIONS.HEADINGS_LIST]: HeadingExtensionStorage;
  }
}

export const HeadingListExtension = Extension.create<unknown, HeadingExtensionStorage>({
  name: CORE_EXTENSIONS.HEADINGS_LIST,

  addStorage() {
    return {
      headings: [] as IMarking[],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey("heading-list"),
      appendTransaction: (_, __, newState) => {
        const headings: IMarking[] = [];
        const sequences = new Map<number, number>();

        newState.doc.descendants((node) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level;
            const text = node.textContent;
            const sequence = (sequences.get(level) ?? 0) + 1;
            sequences.set(level, sequence);

            headings.push({
              type: "heading",
              level: level,
              text: text,
              sequence,
            });
          }
        });

        this.storage.headings = headings;

        this.editor.emit("update", {
          editor: this.editor,
          transaction: newState.tr,
          appendedTransactions: [],
        });

        return null;
      },
    });

    return [plugin];
  },
});
