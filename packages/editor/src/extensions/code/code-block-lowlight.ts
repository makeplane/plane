/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// import CodeBlock, { CodeBlockOptions } from "@tiptap/extension-code-block";

import type { CodeBlockOptions } from "./code-block";
import { CodeBlock } from "./code-block";
import { LowlightPlugin } from "./lowlight-plugin";

type CodeBlockLowlightOptions = CodeBlockOptions & {
  lowlight: any;
  defaultLanguage: string | null | undefined;
};

export const CodeBlockLowlight = CodeBlock.extend<CodeBlockLowlightOptions>({
  addOptions() {
    return {
      ...(this.parent?.() ?? {
        languageClassPrefix: "language-",
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
        HTMLAttributes: {},
      }),
      lowlight: {},
      defaultLanguage: null,
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      LowlightPlugin({
        name: this.name,
        lowlight: this.options.lowlight,
        defaultLanguage: this.options.defaultLanguage,
      }),
    ];
  },
});
