/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { lowlight } from "../code/lowlight";

describe("code block lowlight", () => {
  it.each(["powershell", "ps1", "pwsh", "ts"])("registers %s", (language) => {
    expect(lowlight.registered(language)).toBe(true);
  });

  it("highlights PowerShell cmdlets and variables", () => {
    const tree = lowlight.highlight("powershell", 'Get-ChildItem -Path $env:USERPROFILE | Write-Output "done"');
    const classes = JSON.stringify(tree);
    expect(classes).toContain("hljs-built_in");
    expect(classes).toContain("hljs-variable");
  });
});
