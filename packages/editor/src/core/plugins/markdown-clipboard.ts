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

import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// plane imports
import { convertHTMLToMarkdown } from "@plane/utils";
import type { TCustomComponentsMetaData } from "@plane/utils";
import { parseEditorHTMLtoGlobalHTML } from "../utils/editor-html-parser";
import { cleanEditorHTML } from "../utils/editor-clean-html";

type TArgs = {
  editor: Editor;
  getEditorMetaData: (htmlContent: string) => TCustomComponentsMetaData;
};

export const MarkdownClipboardPlugin = (args: TArgs): Plugin => {
  const { editor, getEditorMetaData } = args;

  return new Plugin({
    key: new PluginKey("markdownClipboard"),
    props: {
      handleDOMEvents: {
        copy: (view, event) => {
          try {
            event.preventDefault();
            event.clipboardData?.clearData();
            // editor meta data
            const editorHTML = editor.getHTML();
            const metaData = getEditorMetaData(editorHTML);
            // meta data from selection
            const clipboardHTML = view.serializeForClipboard(view.state.selection.content()).dom.innerHTML;
            // convert to markdown
            const convertedHTML = parseEditorHTMLtoGlobalHTML(clipboardHTML);
            // clean the HTML
            const cleanedHTML = cleanEditorHTML(clipboardHTML);

            const markdown = convertHTMLToMarkdown({
              description_html: clipboardHTML,
              metaData,
            });
            event.clipboardData?.setData("text/plain", markdown);
            event.clipboardData?.setData("text/html", convertedHTML);
            event.clipboardData?.setData("text/plane-editor-html", cleanedHTML);
            return true;
          } catch (error) {
            console.error("Failed to copy markdown content to clipboard:", error);
            return false;
          }
        },
      },
    },
  });
};
