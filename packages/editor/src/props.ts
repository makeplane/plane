/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";
// helpers
import { processAssetDuplication } from "@/helpers/paste-asset";

type TArgs = {
  editorClassName: string;
};

export const CoreEditorProps = (props: TArgs): EditorProps => {
  const { editorClassName } = props;

  return {
    attributes: {
      class: cn(
        "prose-brand prose-headings:font-display font-default max-w-full prose focus:outline-none",
        editorClassName
      ),
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        // prevent default event listeners from firing when slash command is active
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) {
            return true;
          }
        }
      },
    },
    handlePaste: (view, event) => {
      if (!event.clipboardData) return false;

      const htmlContent = event.clipboardData.getData("text/plane-editor-html");
      if (htmlContent) {
        const { processedHtml } = processAssetDuplication(htmlContent);
        view.pasteHTML(processedHtml);
        return true;
      }

      const plainText = event.clipboardData.getData("text/plain");
      if (plainText && !event.defaultPrevented) {
        let signals = 0;
        if (/^#{1,6}\s+\S+/m.test(plainText)) signals += 2;
        if (/^[-*+]\s+\S+/m.test(plainText)) signals += 2;
        if (/^\d+\.\s+\S+/m.test(plainText)) signals += 2;
        if (/^>\s+\S+/m.test(plainText)) signals += 2;
        if (/```[\s\S]*?```/m.test(plainText)) signals += 3;
        if (/`[^`\n]+`/.test(plainText)) signals += 1;
        if (/(\*\*|__)[^\n]+?(\*\*|__)/.test(plainText)) signals += 1;
        if (/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(plainText)) signals += 2;
        if (/^-\s+\[[ xX]\]\s+\S+/m.test(plainText)) signals += 2;

        if (signals > 0) {
          const html = event.clipboardData.getData("text/html");
          if (!html || !/<table|<img|<h[1-6]/i.test(html)) {
            try {
              // @ts-expect-error markdown-it in bundle
              const mdFactory = typeof markdownit !== "undefined" ? markdownit : null;
              if (mdFactory) {
                const rendered = mdFactory({ html: true, linkify: true, breaks: true }).render(plainText);
                if (rendered) {
                  view.pasteHTML(rendered);
                  event.preventDefault();
                  return true;
                }
              }
            } catch (err) {
              console.error("Markdown paste error:", err);
            }
          }
        }
      }

      return false;
    },
  };
};
