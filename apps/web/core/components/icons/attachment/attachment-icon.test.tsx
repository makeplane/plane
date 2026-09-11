/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";

import { DefaultIcon, TxtIcon } from "@/components/icons/attachment";

import { getFileIcon } from "./attachment-icon";

describe("getFileIcon", () => {
  it.each(["md", "markdown", "mdx", "MD", "MARKDOWN", "MDX"])(
    "uses the text icon for the %s extension",
    (extension) => {
      expect(getFileIcon(extension).type).toBe(TxtIcon);
    }
  );

  it("uses the default icon for an unknown extension", () => {
    expect(getFileIcon("unknown").type).toBe(DefaultIcon);
  });
});
