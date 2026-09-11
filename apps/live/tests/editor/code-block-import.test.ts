/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor";
import { describe, expect, it } from "vitest";

describe("document code-block import", () => {
  it("preserves fenced-code language metadata through Plane Live conversion", () => {
    const input = '<pre><code class="language-mermaid">stateDiagram-v2\n  [*] --&gt; Ready\n</code></pre>';

    const binary = getBinaryDataFromDocumentEditorHTMLString(input);
    const { contentHTML, contentJSON } = getAllDocumentFormatsFromDocumentEditorBinaryData(binary, false);

    expect(contentJSON).toMatchObject({
      content: [
        {
          type: "codeBlock",
          attrs: { language: "mermaid" },
        },
      ],
    });
    expect(contentHTML).toContain('class="language-mermaid"');
  });
});
