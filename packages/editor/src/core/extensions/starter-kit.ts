/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Extension, wrappingInputRule } from "@tiptap/core";
import { BulletList } from "@tiptap/extension-bullet-list";
import StarterKit from "@tiptap/starter-kit";

type TArgs = {
  enableHistory: boolean;
};

// tiptap also runs input rules on Enter (as "\n"), so the default `^\s*([-+*])\s$` turns a lone "+" into a list.
// "+" is the page embed trigger, so it only starts a bullet list when followed by a real space.
const BULLET_LIST_INPUT_REGEX = /^\s*(?:[-*]\s|\+ )$/;

const CustomBulletList = BulletList.extend({
  addInputRules() {
    return [wrappingInputRule({ find: BULLET_LIST_INPUT_REGEX, type: this.type })];
  },
});

export const CustomStarterKitExtension = (args: TArgs) => {
  const { enableHistory } = args;

  return Extension.create({
    name: "customStarterKit",

    addExtensions() {
      return [
        StarterKit.configure({
          bulletList: false,
          orderedList: {
            HTMLAttributes: {
              class: "list-decimal pl-7 space-y-(--list-spacing-y)",
            },
          },
          listItem: {
            HTMLAttributes: {
              class: "not-prose space-y-2",
            },
          },
          code: false,
          codeBlock: false,
          horizontalRule: false,
          blockquote: false,
          paragraph: {
            HTMLAttributes: {
              class: "editor-paragraph-block",
            },
          },
          heading: {
            HTMLAttributes: {
              class: "editor-heading-block",
            },
          },
          dropcursor: {
            class:
              "text-tertiary transition-all motion-reduce:transition-none motion-reduce:hover:transform-none duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)]",
          },
          ...(enableHistory ? {} : { history: false }),
        }),
        CustomBulletList.configure({
          HTMLAttributes: {
            class: "list-disc pl-7 space-y-(--list-spacing-y)",
          },
        }),
      ];
    },
  });
};
