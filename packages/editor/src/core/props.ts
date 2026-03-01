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

import type { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";
// helpers
import { processAssetDuplication } from "@/helpers/paste-asset";
import { normalizeCodeBlockHTML } from "@/utils/normalize-code-blocks";

type TArgs = {
  editorClassName: string;
};

const stripCommentMarksFromHTML = (html: string): string => {
  const sanitizedHtml = html.replace(/<img.*?>/g, "");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = sanitizedHtml;

  const commentNodes = Array.from(wrapper.querySelectorAll("span[data-comment-id]"));
  commentNodes.forEach((node) => {
    const parentNode = node.parentNode;
    if (!parentNode) return;

    while (node.firstChild) {
      parentNode.insertBefore(node.firstChild, node);
    }

    parentNode.removeChild(node);
  });

  return wrapper.innerHTML;
};

export const CoreEditorProps = (props: TArgs): EditorProps => {
  const { editorClassName } = props;

  return {
    attributes: {
      class: cn(
        "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
        editorClassName
      ),
      inputMode: "text",
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        // prevent default event listeners from firing when slash command is active
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) return true;
        }
      },
    },
    handlePaste: (view, event) => {
      if (!event.clipboardData) return false;

      const htmlContent = event.clipboardData.getData("text/plane-editor-html");
      if (!htmlContent) return false;

      const { processedHtml } = processAssetDuplication(htmlContent);
      view.pasteHTML(processedHtml);
      return true;
    },
    transformPastedHTML(html) {
      const stripped = stripCommentMarksFromHTML(html);
      return normalizeCodeBlockHTML(stripped);
    },
  };
};
