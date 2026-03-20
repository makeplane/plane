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

import { describe, it, expect } from "vitest";
import { normalizeConfluenceHTML } from "../confluence-html-normalizer";

/**
 * Integration tests for Confluence→Plane HTML migration.
 *
 * These run the full pipeline: DOM transforms → Tiptap schema round-trip.
 * Output includes editor-specific classes, so assertions verify semantic
 * correctness, not exact markup.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function assertContainsAll(result: string, expected: string[]) {
  for (const s of expected) {
    expect(result, `Expected result to contain "${s}"`).toContain(s);
  }
}

function assertContainsNone(result: string, unexpected: string[]) {
  for (const s of unexpected) {
    expect(result, `Expected result NOT to contain "${s}"`).not.toContain(s);
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("normalizeConfluenceHTML", () => {
  // ─── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("returns an empty editor paragraph for empty string", () => {
      expect(normalizeConfluenceHTML("")).toBe("<p></p>");
    });

    it("returns an empty editor paragraph for whitespace-only string", () => {
      expect(normalizeConfluenceHTML("   ")).toBe("<p></p>");
    });

    it("handles plain text in a paragraph", () => {
      const result = normalizeConfluenceHTML("<p>Hello world</p>");
      expect(result).toContain("Hello world");
    });
  });

  // ─── 1. Body content extraction ────────────────────────────────────────

  describe("body content extraction", () => {
    it("extracts content from #main-content.wiki-content", () => {
      const html = `
        <html>
          <head><title>Page</title></head>
          <body>
            <div id="header">Navigation stuff</div>
            <div id="main-content" class="wiki-content">
              <p>Actual page content here.</p>
            </div>
            <div id="footer">Footer stuff</div>
          </body>
        </html>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Actual page content here.");
      assertContainsNone(result, ["Navigation stuff", "Footer stuff"]);
    });

    it("uses full HTML when #main-content is not found", () => {
      const html = `<p>Just a plain paragraph.</p>`;
      const result = normalizeConfluenceHTML(html);
      expect(result).toContain("Just a plain paragraph.");
    });
  });

  // ─── 2. Script/style removal ──────────────────────────────────────────

  describe("script and style removal", () => {
    it("removes script and style elements", () => {
      const html = `
        <style>.wiki-content { color: red; }</style>
        <p>Visible content</p>
        <script>alert("xss")</script>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Visible content");
      assertContainsNone(result, ["<script", "<style", "alert", "color: red"]);
    });
  });

  // ─── 3. Code blocks ───────────────────────────────────────────────────

  describe("code blocks", () => {
    it("converts syntaxhighlighter code block with brush param", () => {
      const html = `
        <div class="code panel pdl" style="border-width: 1px;">
          <div class="codeContent panelContent pdl">
            <pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: bash; gutter: false">echo "Hello World"</pre>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ["<pre>", "language-bash", "echo"]);
      assertContainsNone(result, ["code panel", "codeContent", "syntaxhighlighter"]);
    });

    it("converts code block with Java brush", () => {
      const html = `
        <div class="code panel pdl">
          <div class="codeContent panelContent pdl">
            <pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: java; gutter: true">public class Foo {}</pre>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ["language-java", "public class Foo"]);
    });

    it("handles code block without language", () => {
      const html = `
        <div class="code panel pdl">
          <div class="codeContent panelContent pdl">
            <pre>plain code here</pre>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ["<pre>", "<code", "plain code here"]);
    });
  });

  // ─── 4. Information macros → callouts ─────────────────────────────────

  describe("information macros → callouts", () => {
    it("converts info macro to light-blue callout", () => {
      const html = `
        <div class="confluence-information-macro confluence-information-macro-information">
          <span class="aui-icon aui-icon-small aui-iconfont-info confluence-information-macro-icon"></span>
          <div class="confluence-information-macro-body">
            <p>This is important information.</p>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="light-blue"',
        'data-logo-in-use="emoji"',
        "This is important information.",
      ]);
    });

    it("converts warning macro to orange callout", () => {
      const html = `
        <div class="confluence-information-macro confluence-information-macro-warning">
          <span class="aui-icon confluence-information-macro-icon"></span>
          <div class="confluence-information-macro-body">
            <p>Be careful with this operation!</p>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="orange"',
        "Be careful with this operation!",
      ]);
    });

    it("converts tip macro to green callout", () => {
      const html = `
        <div class="confluence-information-macro confluence-information-macro-tip">
          <span class="aui-icon confluence-information-macro-icon"></span>
          <div class="confluence-information-macro-body">
            <p>Use caching for better performance.</p>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ['data-background="green"', "Use caching for better performance."]);
    });

    it("converts note macro to purple callout", () => {
      const html = `
        <div class="confluence-information-macro confluence-information-macro-note">
          <span class="aui-icon confluence-information-macro-icon"></span>
          <div class="confluence-information-macro-body">
            <p>This API will be deprecated.</p>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ['data-background="purple"', "This API will be deprecated."]);
    });
  });

  // ─── 5. User mentions ─────────────────────────────────────────────────

  describe("user mentions", () => {
    it("converts confluence-userlink to @mention text", () => {
      const html = `<p>Assigned to <a class="confluence-userlink user-mention" data-username="jdoe" href="/display/~jdoe">John Doe</a></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("@John Doe");
      assertContainsNone(result, ["confluence-userlink", "user-mention", "data-username"]);
    });
  });

  // ─── 6. Images ────────────────────────────────────────────────────────

  describe("images", () => {
    it("unwraps images from confluence embedded file wrapper", () => {
      const html = `<span class="confluence-embedded-file-wrapper confluence-embedded-manual-size"><img class="confluence-embedded-image" src="attachments/screenshot.png" /></span>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("attachments/screenshot.png");
      expect(result).not.toContain("confluence-embedded-file-wrapper");
    });
  });

  // ─── 7. Layout flattening ─────────────────────────────────────────────

  describe("layout flattening", () => {
    it("flattens contentLayout2 wrappers", () => {
      const html = `
        <div class="contentLayout2">
          <div class="columnLayout single" data-layout="single">
            <div class="cell normal" data-type="normal">
              <div class="innerCell">
                <p>Content inside layout.</p>
              </div>
            </div>
          </div>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Content inside layout.");
      assertContainsNone(result, ["contentLayout2", "columnLayout", "innerCell"]);
    });
  });

  // ─── 8. Unwanted macro removal ────────────────────────────────────────

  describe("unwanted macro removal", () => {
    it("removes TOC macro", () => {
      const html = `
        <div class="toc-macro rbtoc123">
          <ul><li>Section 1</li></ul>
        </div>
        <p>Actual content</p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Actual content");
      expect(result).not.toContain("toc-macro");
    });

    it("removes recently-updated macro", () => {
      const html = `
        <div class="recently-updated">
          <p>Last updated list</p>
        </div>
        <p>Page content</p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Page content");
      expect(result).not.toContain("recently-updated");
    });
  });

  // ─── 9. Tables ────────────────────────────────────────────────────────

  describe("tables", () => {
    it("strips Confluence-specific classes from tables", () => {
      const html = `
        <table class="confluenceTable">
          <tbody>
            <tr><th class="confluenceTh">Header</th></tr>
            <tr><td class="confluenceTd">Data</td></tr>
          </tbody>
        </table>`;

      const result = normalizeConfluenceHTML(html);

      assertContainsAll(result, ["Header", "Data"]);
      assertContainsNone(result, ["confluenceTable", "confluenceTh", "confluenceTd"]);
    });
  });

  // ─── 10. Links ────────────────────────────────────────────────────────

  describe("links", () => {
    it("converts unresolved links to plain text", () => {
      const html = `<p>See <a class="unresolved" href="#">Missing Page</a></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Missing Page");
      expect(result).not.toContain("unresolved");
    });

    it("converts internal .html links to plain text", () => {
      const html = `<p>Read <a href="Design-Document_12345.html">Design Document</a></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Design Document");
      expect(result).not.toContain(".html");
    });

    it("preserves external links", () => {
      const html = `<p>Visit <a href="https://example.com" class="external-link" rel="nofollow">Example</a></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("https://example.com");
      expect(result).toContain("Example");
      expect(result).not.toContain("external-link");
    });
  });

  // ─── 11. Status lozenges ──────────────────────────────────────────────

  describe("status lozenges", () => {
    it("converts status lozenge to bold text", () => {
      const html = `<p>Status: <span class="aui-lozenge aui-lozenge-success">APPROVED</span></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("<strong>APPROVED</strong>");
      expect(result).not.toContain("aui-lozenge");
    });
  });

  // ─── 12. Date elements ────────────────────────────────────────────────

  describe("date elements", () => {
    it("replaces time elements with text content", () => {
      const html = `<p>Due: <time datetime="2022-09-13" class="date-past">13 Sep 2022</time></p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("13 Sep 2022");
      expect(result).not.toContain("<time");
    });
  });

  // ─── 13. Heading anchors ──────────────────────────────────────────────

  describe("heading anchors", () => {
    it("removes auto-generated heading IDs", () => {
      const html = `<h2 id="CopyofDecisionRecords-OG:">Decision Records</h2>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Decision Records");
      expect(result).not.toContain("CopyofDecisionRecords");
    });
  });

  // ─── 14. Confluence anchors ───────────────────────────────────────────

  describe("confluence anchors", () => {
    it("removes confluence anchor spans", () => {
      const html = `<p><span class="confluence-anchor-link" id="anchor1"></span>Content after anchor</p>`;

      const result = normalizeConfluenceHTML(html);

      expect(result).toContain("Content after anchor");
      expect(result).not.toContain("confluence-anchor-link");
    });
  });

  // ─── 15. Complex real-world content ───────────────────────────────────

  describe("complex real-world Confluence content", () => {
    it("handles a full Confluence page with mixed content types", () => {
      const html = `
        <div id="main-content" class="wiki-content">
          <div class="contentLayout2">
            <div class="columnLayout single" data-layout="single">
              <div class="cell normal" data-type="normal">
                <div class="innerCell">
                  <h2 id="ProjectSetup-Overview">Overview</h2>
                  <p>Project lead: <a class="confluence-userlink user-mention" data-username="alice" href="/display/~alice">Alice Smith</a></p>

                  <div class="confluence-information-macro confluence-information-macro-warning">
                    <span class="aui-icon confluence-information-macro-icon"></span>
                    <div class="confluence-information-macro-body">
                      <p>This project is under NDA.</p>
                    </div>
                  </div>

                  <h3>Setup</h3>
                  <div class="code panel pdl">
                    <div class="codeContent panelContent pdl">
                      <pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: bash; gutter: false">npm install
npm run build</pre>
                    </div>
                  </div>

                  <table class="confluenceTable">
                    <tbody>
                      <tr><th class="confluenceTh">Env</th><th class="confluenceTh">URL</th></tr>
                      <tr><td class="confluenceTd">Prod</td><td class="confluenceTd">https://app.example.com</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <script>console.log("tracking")</script>
        </div>`;

      const result = normalizeConfluenceHTML(html);

      // Content extracted from main-content
      expect(result).toContain("Overview");
      expect(result).not.toContain("ProjectSetup-Overview");

      // User mention
      expect(result).toContain("@Alice Smith");
      expect(result).not.toContain("confluence-userlink");

      // Warning callout
      expect(result).toContain('data-background="orange"');
      expect(result).toContain("This project is under NDA.");

      // Code block
      expect(result).toContain("language-bash");
      expect(result).toContain("npm install");

      // Table cleaned
      assertContainsAll(result, ["Prod", "https://app.example.com"]);
      expect(result).not.toContain("confluenceTable");

      // Layout flattened
      expect(result).not.toContain("contentLayout2");
      expect(result).not.toContain("innerCell");

      // Script removed
      expect(result).not.toContain("<script");
      expect(result).not.toContain("tracking");
    });
  });
});
