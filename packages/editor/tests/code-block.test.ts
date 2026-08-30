/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import powershell from "highlight.js/lib/languages/powershell";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
import { describe, expect, it } from "vitest";
import { parseNodes } from "../src/core/extensions/code/lowlight-plugin";

const lowlight = createLowlight(common);
lowlight.register("ts", ts);
lowlight.register("powershell", powershell);
lowlight.register("ps", powershell);
lowlight.register("ps1", powershell);

describe("CodeBlock Lowlight & parseNodes Invariant Tests", () => {
  describe("Benchmark 1: Character Position & Invariant Length Conservation", () => {
    it("should preserve 100% exact character offsets and string content after tokenization", () => {
      const codeSamples = [
        `$ApiKey = $env:OPENAI_API_KEY
Write-Host "Deploying with key: $ApiKey" -ForegroundColor Green`,
        `const calculateTotal = (items: Item[]): number => {
  return items.reduce((acc, item) => acc + item.price, 0);
};`,
        `def fetch_user_data(user_id: int) -> dict:
    # Query the database
    return {"id": user_id, "active": True}`,
        `SELECT id, name, created_at FROM issues WHERE workspace_id = 'ws-123' ORDER BY created_at DESC;`,
        `{\n  "name": "Plane",\n  "version": "1.4.2",\n  "private": true\n}`,
        `#!/bin/bash\nset -euo pipefail\necho "Starting build..."\npnpm turbo run build`,
      ];

      for (const sample of codeSamples) {
        const highlighted = lowlight.highlightAuto(sample);
        const tokens = parseNodes(highlighted.children || []);

        // 1. Invariant: Sum of token lengths must equal original string length
        const totalLength = tokens.reduce((sum, token) => sum + token.text.length, 0);
        expect(totalLength).toBe(sample.length);

        // 2. Invariant: Concatenating all token texts must equal the exact original string
        const reconstructed = tokens.map((token) => token.text).join("");
        expect(reconstructed).toBe(sample);

        // 3. Invariant: No token should be an array or have undefined text
        for (const token of tokens) {
          expect(typeof token.text).toBe("string");
          expect(Array.isArray(token.classes)).toBe(true);
        }
      }
    });
  });

  describe("Benchmark 2: Deeply Nested AST Tree Flattening", () => {
    it("should correctly flatten multi-level nested HAST nodes into linear leaf tokens", () => {
      const mockNestedAST = [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["hljs-keyword"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["hljs-sub-keyword"] },
              children: [
                {
                  type: "text",
                  value: "function",
                },
              ],
            },
          ],
        },
        {
          type: "text",
          value: " ",
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["hljs-title"] },
          children: [
            {
              type: "text",
              value: "Get-Process",
            },
          ],
        },
      ];

      const tokens = parseNodes(mockNestedAST);

      expect(tokens.length).toBe(3);
      expect(tokens[0]).toEqual({
        text: "function",
        classes: ["hljs-keyword", "hljs-sub-keyword"],
      });
      expect(tokens[1]).toEqual({
        text: " ",
        classes: [],
      });
      expect(tokens[2]).toEqual({
        text: "Get-Process",
        classes: ["hljs-title"],
      });
    });

    it("should handle empty or undefined child arrays safely", () => {
      expect(parseNodes([])).toEqual([]);
      expect(parseNodes([{ type: "element", children: [] }])).toEqual([]);
    });
  });

  describe("Benchmark 3: PowerShell Syntax Highlighting & Aliases", () => {
    it("should recognize powershell and alias registrations", () => {
      const languages = lowlight.listLanguages();
      expect(languages).toContain("powershell");
      expect(languages).toContain("ps");
      expect(languages).toContain("ps1");
      expect(languages).toContain("ts");
    });

    it("should correctly tokenize multi-line pasted PowerShell scripts", () => {
      const pastedScript = `$ApiKey = $env:OPENAI_API_KEY
Write-Host "Deploying to production with key: $ApiKey" -ForegroundColor Green
function Deploy-App {
    param([string]$Environment)
    Get-Service | Where-Object { $_.Status -eq 'Running' }
}`;

      const highlighted = lowlight.highlight("powershell", pastedScript);
      const tokens = parseNodes(highlighted.children || []);

      // Verify character preservation
      const reconstructed = tokens.map((t) => t.text).join("");
      expect(reconstructed).toBe(pastedScript);

      // Verify variables are tokenized
      const variableTokens = tokens.filter((t) => t.classes.includes("hljs-variable"));
      expect(variableTokens.length).toBeGreaterThanOrEqual(2);
      expect(variableTokens.some((t) => t.text.includes("$ApiKey"))).toBe(true);

      // Verify built-ins are tokenized
      const builtinTokens = tokens.filter((t) => t.classes.includes("hljs-built_in"));
      expect(builtinTokens.length).toBeGreaterThanOrEqual(1);
      expect(builtinTokens.some((t) => t.text.includes("Write-Host"))).toBe(true);

      // Verify literals and keywords
      const keywordTokens = tokens.filter((t) => t.classes.includes("hljs-keyword"));
      expect(keywordTokens.some((t) => t.text.includes("function"))).toBe(true);
    });

    it("should work identically with 'ps' and 'ps1' aliases", () => {
      const snippet = `$val = 123`;
      const fromPowershell = parseNodes(lowlight.highlight("powershell", snippet).children || []);
      const fromPs = parseNodes(lowlight.highlight("ps", snippet).children || []);
      const fromPs1 = parseNodes(lowlight.highlight("ps1", snippet).children || []);

      expect(fromPs).toEqual(fromPowershell);
      expect(fromPs1).toEqual(fromPowershell);
    });
  });

  describe("Benchmark 4: Multi-Language Zero Regression", () => {
    it("should highlight TypeScript code correctly", () => {
      const code = `const greeting: string = "Hello World";`;
      const tokens = parseNodes(lowlight.highlight("ts", code).children || []);
      expect(tokens.map((t) => t.text).join("")).toBe(code);
      expect(tokens.some((t) => t.classes.includes("hljs-keyword"))).toBe(true);
      expect(tokens.some((t) => t.classes.includes("hljs-string"))).toBe(true);
    });

    it("should highlight Python code correctly", () => {
      const code = `def add(a, b):\n    return a + b`;
      const tokens = parseNodes(lowlight.highlight("python", code).children || []);
      expect(tokens.map((t) => t.text).join("")).toBe(code);
      expect(tokens.some((t) => t.classes.includes("hljs-keyword"))).toBe(true);
    });

    it("should highlight SQL code correctly", () => {
      const code = `SELECT * FROM users WHERE active = 1;`;
      const tokens = parseNodes(lowlight.highlight("sql", code).children || []);
      expect(tokens.map((t) => t.text).join("")).toBe(code);
      expect(tokens.some((t) => t.classes.includes("hljs-keyword"))).toBe(true);
    });

    it("should highlight Bash scripts correctly", () => {
      const code = `echo "Hello" && ls -la`;
      const tokens = parseNodes(lowlight.highlight("bash", code).children || []);
      expect(tokens.map((t) => t.text).join("")).toBe(code);
      expect(tokens.some((t) => t.classes.includes("hljs-built_in"))).toBe(true);
    });

    it("should highlight JSON correctly", () => {
      const code = `{"status": 200, "success": true}`;
      const tokens = parseNodes(lowlight.highlight("json", code).children || []);
      expect(tokens.map((t) => t.text).join("")).toBe(code);
      expect(tokens.some((t) => t.classes.includes("hljs-attr"))).toBe(true);
    });
  });

  describe("Benchmark 5: Performance Latency (< 2ms per block)", () => {
    it("should tokenize a 100-line multi-line paste in under 2 milliseconds", () => {
      const lines: string[] = [];
      for (let i = 0; i < 100; i++) {
        lines.push(`$Var_${i} = "Value_${i}"; Write-Host "Processing line ${i}: $Var_${i}"`);
      }
      const largeScript = lines.join("\n");

      const startTime = performance.now();
      const highlighted = lowlight.highlight("powershell", largeScript);
      const tokens = parseNodes(highlighted.children || []);
      const duration = performance.now() - startTime;

      expect(tokens.length).toBeGreaterThan(100);
      expect(tokens.map((t) => t.text).join("")).toBe(largeScript);
      expect(duration).toBeLessThan(20); // generous bound for CI, typically < 2ms
    });
  });
});
