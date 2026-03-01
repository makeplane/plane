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

export const HeadingListExtension = Extension.create<never, HeadingExtensionStorage>({
  name: CORE_EXTENSIONS.HEADINGS_LIST,

  addStorage(): HeadingExtensionStorage {
    return {
      headings: [],
    };
  },

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey("heading-list"),
      appendTransaction: (transactions, oldState, newState) => {
        // Skip if no document changes
        const hasDocChanges = transactions.some((tr) => tr.docChanged);
        if (!hasDocChanges || oldState.doc.eq(newState.doc)) {
          return null;
        }

        const headings: IMarking[] = [];
        // Use a Map to handle all heading levels (1-6) correctly
        const sequenceByLevel = new Map<number, number>();

        newState.doc.descendants((node, _pos) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level as number;
            const text = node.textContent;
            const currentSeq = (sequenceByLevel.get(level) ?? 0) + 1;
            sequenceByLevel.set(level, currentSeq);

            headings.push({
              type: "heading",
              level: level,
              text: text,
              sequence: currentSeq,
            });
          }
        });

        // Only update storage if headings actually changed
        const prevHeadings = this.storage.headings;
        const headingsChanged =
          prevHeadings.length !== headings.length ||
          headings.some(
            (h, i) =>
              h.level !== prevHeadings[i]?.level ||
              h.text !== prevHeadings[i]?.text ||
              h.sequence !== prevHeadings[i]?.sequence
          );

        if (headingsChanged) {
          this.storage.headings = headings;
        }

        return null;
      },
    });

    return [plugin];
  },

  getHeadings() {
    return (this.storage as HeadingExtensionStorage).headings;
  },
} as const);
