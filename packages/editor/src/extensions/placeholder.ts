/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isNodeEmpty } from "@tiptap/core";
import { Placeholder } from "@tiptap/extensions";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { IEditorProps } from "@/types";

type TArgs = {
  placeholder: IEditorProps["placeholder"];
  showPlaceholderOnEmpty: IEditorProps["showPlaceholderOnEmpty"];
};

// v3 builds placeholders in plugin state from the previous editor state and only rescans the blocks a
// transaction touched, so focus- and document-dependent placeholders go stale. Build them from the current
// view state on every update, as v2 did.
const LivePlaceholder = Placeholder.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("placeholder"),
        props: {
          decorations: ({ doc, selection }) => {
            const { editor, options } = this;
            if (!editor.isEditable && options.showOnlyWhenEditable) return null;
            const { anchor } = selection;
            const isEmptyDoc = editor.isEmpty;
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              if ((hasAnchor || !options.showOnlyCurrent) && !node.isLeaf && isNodeEmpty(node)) {
                const emptyNodeClass =
                  typeof options.emptyNodeClass === "function"
                    ? options.emptyNodeClass({ editor, node, pos, hasAnchor })
                    : options.emptyNodeClass;
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: isEmptyDoc ? `${emptyNodeClass} ${options.emptyEditorClass}` : emptyNodeClass,
                    "data-placeholder":
                      typeof options.placeholder === "function"
                        ? options.placeholder({ editor, node, pos, hasAnchor })
                        : options.placeholder,
                  })
                );
              }
              return options.includeChildren;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export const CustomPlaceholderExtension = (args: TArgs) => {
  const { placeholder, showPlaceholderOnEmpty = false } = args;

  return LivePlaceholder.configure({
    placeholder: ({ editor, node }) => {
      if (!editor.isEditable) return "";

      if (node.type.name === CORE_EXTENSIONS.HEADING) return `Heading ${node.attrs.level}`;

      const isUploadInProgress = editor.storage.utility?.uploadInProgress;

      if (isUploadInProgress) return "";

      const shouldHidePlaceholder =
        editor.isActive(CORE_EXTENSIONS.TABLE) ||
        editor.isActive(CORE_EXTENSIONS.CODE_BLOCK) ||
        editor.isActive(CORE_EXTENSIONS.IMAGE) ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE);

      if (shouldHidePlaceholder) return "";

      if (showPlaceholderOnEmpty) {
        const isDocumentEmpty = editor.state.doc.textContent.length === 0;
        if (!isDocumentEmpty) {
          return "";
        }
      }

      if (placeholder) {
        if (typeof placeholder === "string") return placeholder;
        else return placeholder(editor.isFocused, editor.getHTML());
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  });
};
