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
import { normalizeJiraHTML } from "../jira-html-normalizer";

/**
 * Integration tests for Jira→Plane HTML migration.
 *
 * These run the full pipeline: DOM transforms → Tiptap schema round-trip.
 * Output includes editor-specific classes (e.g. `editor-paragraph-block`),
 * so assertions verify semantic correctness, not exact markup.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse the result into a DOM-like check without depending on exact classes */
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

describe("normalizeJiraHTML", () => {
  // ─── Edge cases ─────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("returns an empty editor paragraph for empty string", () => {
      expect(normalizeJiraHTML("")).toBe("<p></p>");
    });

    it("returns an empty editor paragraph for whitespace-only string", () => {
      expect(normalizeJiraHTML("   ")).toBe("<p></p>");
    });

    it("handles plain text in a paragraph", () => {
      const result = normalizeJiraHTML("<p>Hello world</p>");
      expect(result).toContain("Hello world");
    });
  });

  // ─── 1. Code blocks ────────────────────────────────────────────────────

  describe("code blocks", () => {
    it("converts a Java code panel and preserves language + content", () => {
      const jiraHtml = `
        <div class="code panel">
          <div class="codeContent panelContent">
            <pre class="code-java">public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}</pre>
          </div>
        </div>`;

      const result = normalizeJiraHTML(jiraHtml);

      assertContainsAll(result, ["<pre>", "language-java", "public class Main", "System.out.println"]);
      assertContainsNone(result, ["code panel", "codeContent", "panelContent"]);
    });

    it("converts a TypeScript code panel", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre class="code-typescript">const x: number = 42;</pre></div></div>`
      );

      assertContainsAll(result, ["language-typescript", "const x: number = 42;"]);
    });

    it("converts a noformat/preformatted panel without language", () => {
      const result = normalizeJiraHTML(
        `<div class="preformatted panel"><div class="preformattedContent panelContent"><pre>plain raw text here</pre></div></div>`
      );

      assertContainsAll(result, ["<pre>", "<code", "plain raw text here"]);
      assertContainsNone(result, ["panelContent"]);
    });
  });

  // ─── 2. Panels → callouts ──────────────────────────────────────────────

  describe("panels → callouts", () => {
    it("converts info panel (by background color) to light-blue callout", () => {
      const jiraHtml = `
        <div class="panel" style="background-color: #dfe1e6;">
          <div class="panelContent">
            <p>Database migrations must be run before deploying.</p>
          </div>
        </div>`;

      const result = normalizeJiraHTML(jiraHtml);

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="light-blue"',
        'data-logo-in-use="emoji"',
        "Database migrations must be run before deploying.",
      ]);
    });

    it("converts warning panel (by class) to orange callout", () => {
      const result = normalizeJiraHTML(
        `<div class="panel warningMacroPadding"><div class="panelContent"><p>Do not delete production data!</p></div></div>`
      );

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="orange"',
        "Do not delete production data!",
      ]);
    });

    it("converts tip panel (by class) to green callout", () => {
      const result = normalizeJiraHTML(
        `<div class="panel tipMacroPadding"><div class="panelContent"><p>Use batch processing for large imports.</p></div></div>`
      );

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="green"',
        "Use batch processing for large imports.",
      ]);
    });

    it("converts note panel (by class) to purple callout", () => {
      const result = normalizeJiraHTML(
        `<div class="panel noteMacroPadding"><div class="panelContent"><p>This API is deprecated.</p></div></div>`
      );

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        'data-background="purple"',
        "This API is deprecated.",
      ]);
    });

    it("preserves panel header text as bold paragraph", () => {
      const result = normalizeJiraHTML(
        `<div class="panel tipMacroPadding"><div class="panelHeader">Pro Tip</div><div class="panelContent"><p>Always write tests first.</p></div></div>`
      );

      assertContainsAll(result, [
        'data-block-type="callout-component"',
        "<strong>Pro Tip</strong>",
        "Always write tests first.",
      ]);
    });

    it("does not convert code panels to callouts", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre class="code-python">print("hi")</pre></div></div>`
      );

      expect(result).not.toContain("callout-component");
      expect(result).toContain("print");
      expect(result).toContain("language-python");
    });
  });

  // ─── 3. Font colors ───────────────────────────────────────────────────

  describe("font color → data-text-color", () => {
    it("maps red hex to peach", () => {
      const result = normalizeJiraHTML(`<p><font color="#ff0000">Critical bug</font></p>`);

      expect(result).toContain("data-text-color");
      expect(result).toContain("Critical bug");
      expect(result).not.toContain("<font");
    });

    it("maps named color 'blue' to dark-blue", () => {
      const result = normalizeJiraHTML(`<p><font color="blue">Link text</font></p>`);
      expect(result).toContain('data-text-color="dark-blue"');
    });

    it("maps #008000 (green) to green", () => {
      const result = normalizeJiraHTML(`<p><font color="#008000">Success</font></p>`);
      expect(result).toContain('data-text-color="green"');
    });

    it("maps #808080 (gray) to gray", () => {
      const result = normalizeJiraHTML(`<p><font color="#808080">Muted text</font></p>`);
      expect(result).toContain('data-text-color="gray"');
    });

    it("maps named 'orange' to orange", () => {
      const result = normalizeJiraHTML(`<p><font color="orange">Warning label</font></p>`);
      expect(result).toContain("data-text-color");
      expect(result).toContain("Warning label");
    });

    it("preserves text content when color is mapped", () => {
      const result = normalizeJiraHTML(`<p>Status: <font color="green">Deployed</font> to production</p>`);

      assertContainsAll(result, ["Status:", "Deployed", "to production"]);
      expect(result).not.toContain("<font");
    });
  });

  // ─── 4. Tag replacements ──────────────────────────────────────────────

  describe("tag replacements", () => {
    it("replaces <tt> with inline code", () => {
      const result = normalizeJiraHTML(`<p>Run <tt>npm install</tt> first</p>`);

      expect(result).toContain("<code");
      expect(result).toContain("npm install");
      expect(result).not.toContain("<tt>");
    });

    it("replaces <ins> with <u>", () => {
      const result = normalizeJiraHTML(`<p><ins>underlined text</ins></p>`);

      expect(result).toContain("<u>");
      expect(result).toContain("underlined text");
      expect(result).not.toContain("<ins>");
    });

    it("replaces <cite> with <em>", () => {
      const result = normalizeJiraHTML(`<p><cite>quoted source</cite></p>`);

      expect(result).toContain("<em>");
      expect(result).toContain("quoted source");
      expect(result).not.toContain("<cite>");
    });
  });

  // ─── 5. User mentions ────────────────────────────────────────────────

  describe("user mentions", () => {
    it("converts Jira user-hover link to @mention text", () => {
      const result = normalizeJiraHTML(
        `<p>Assigned to <a class="user-hover" href="/secure/ViewProfile.jspa?name=jdoe">John Doe</a> for review</p>`
      );

      expect(result).toContain("@John Doe");
      expect(result).toContain("for review");
      expect(result).not.toContain("user-hover");
      expect(result).not.toContain("ViewProfile");
    });
  });

  // ─── 6. Images ────────────────────────────────────────────────────────

  describe("images", () => {
    it("unwraps images from Jira's image-wrap span", () => {
      const result = normalizeJiraHTML(`<p><span class="image-wrap"><img src="screenshot.png" /></span></p>`);

      expect(result).toContain("<img");
      expect(result).not.toContain("image-wrap");
    });

    it("preserves absolute image URLs", () => {
      const result = normalizeJiraHTML(`<p><img src="https://cdn.example.com/diagram.png" /></p>`);

      expect(result).toContain("https://cdn.example.com/diagram.png");
    });
  });

  // ─── 7. Emoticons ────────────────────────────────────────────────────

  describe("emoticons", () => {
    it("converts smile emoticon to 😄", () => {
      const result = normalizeJiraHTML(
        `<p>Great work! <img class="emoticon" alt="(smile)" src="/images/icons/emoticons/smile.gif" /></p>`
      );

      expect(result).toContain("😄");
      expect(result).toContain("Great work!");
      expect(result).not.toContain("emoticon");
    });

    it("converts thumbs-up emoticon to 👍", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(thumbs-up)" src="/images/icons/emoticons/thumbs_up.gif" /></p>`
      );

      expect(result).toContain("👍");
    });

    it("converts tick emoticon to ✅", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(tick)" src="/images/icons/emoticons/check.gif" /></p>`
      );

      expect(result).toContain("✅");
    });

    it("falls back to alt text for unmapped emoticons", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(custom-thing)" src="/images/icons/emoticons/custom.gif" /></p>`
      );

      expect(result).toContain("(custom-thing)");
      expect(result).not.toContain("<img");
    });
  });

  // ─── 8. Heading anchors ──────────────────────────────────────────────

  describe("heading anchors", () => {
    it("removes name-only anchors from headings", () => {
      const result = normalizeJiraHTML(`<h2><a name="section-overview"></a>Overview</h2>`);

      expect(result).toContain("Overview");
      expect(result).not.toContain("section-overview");
    });

    it("preserves anchors that have an href", () => {
      const result = normalizeJiraHTML(`<h2><a href="https://docs.example.com">Linked Heading</a></h2>`);

      expect(result).toContain("https://docs.example.com");
      expect(result).toContain("Linked Heading");
    });
  });

  // ─── 9. Tables ────────────────────────────────────────────────────────

  describe("tables", () => {
    it("strips Confluence-specific classes but preserves table content", () => {
      const result = normalizeJiraHTML(
        `<table class="confluenceTable"><tbody><tr><th class="confluenceTh">Name</th><th class="confluenceTh">Status</th></tr><tr><td class="confluenceTd">Auth</td><td class="confluenceTd">Done</td></tr></tbody></table>`
      );

      assertContainsAll(result, ["<table", "Name", "Status", "Auth", "Done"]);
      assertContainsNone(result, ["confluenceTable", "confluenceTh", "confluenceTd"]);
    });
  });

  // ─── 10. Links ────────────────────────────────────────────────────────

  describe("links", () => {
    it("preserves absolute URLs", () => {
      const result = normalizeJiraHTML(`<p>See <a href="https://docs.example.com/api">API docs</a></p>`);

      expect(result).toContain('href="https://docs.example.com/api"');
      expect(result).toContain("API docs");
    });

    it("strips external-link class", () => {
      const result = normalizeJiraHTML(`<p><a class="external-link" href="https://example.com">Link</a></p>`);

      expect(result).not.toContain("external-link");
      expect(result).toContain("https://example.com");
    });

    it("preserves mailto links", () => {
      const result = normalizeJiraHTML(`<p>Contact <a href="mailto:team@example.com">the team</a></p>`);

      expect(result).toContain('href="mailto:team@example.com"');
    });
  });

  // ─── 11. Confluence anchors ───────────────────────────────────────────

  describe("confluence anchors", () => {
    it("removes confluence anchor spans while keeping surrounding content", () => {
      const result = normalizeJiraHTML(
        `<p><span class="confluence-anchor-link" id="requirements"></span>Functional Requirements</p>`
      );

      expect(result).toContain("Functional Requirements");
      expect(result).not.toContain("confluence-anchor-link");
    });
  });

  // ─── 12. Dash lists ──────────────────────────────────────────────────

  describe("dash lists", () => {
    it("strips alternate class and type attribute, keeps list items", () => {
      const result = normalizeJiraHTML(
        `<ul class="alternate" type="square"><li>First</li><li>Second</li><li>Third</li></ul>`
      );

      assertContainsAll(result, ["First", "Second", "Third"]);
      assertContainsNone(result, ["alternate", 'type="square"']);
    });
  });

  // ─── 13. List nesting fix ─────────────────────────────────────────────

  describe("list nesting", () => {
    it("moves incorrectly-nested sub-list into preceding li", () => {
      const result = normalizeJiraHTML(`<ul><li>Parent item</li><ul><li>Child item</li></ul></ul>`);

      assertContainsAll(result, ["Parent item", "Child item"]);
      // After fix, nested ul should NOT follow a closing </li> as a sibling
      expect(result).not.toMatch(/<\/li>\s*<ul/);
    });

    it("handles deeply nested lists", () => {
      const result = normalizeJiraHTML(`<ul><li>Level 1</li><ul><li>Level 2</li><ul><li>Level 3</li></ul></ul></ul>`);

      assertContainsAll(result, ["Level 1", "Level 2", "Level 3"]);
    });
  });

  // ─── 14. Consecutive list separation ──────────────────────────────────

  describe("consecutive list separation", () => {
    it("inserts separator between consecutive same-type lists", () => {
      const result = normalizeJiraHTML(`<ul><li>List A item</li></ul><ul><li>List B item</li></ul>`);

      assertContainsAll(result, ["List A item", "List B item"]);
      // A <p> separator should exist between the two lists
      expect(result).toMatch(/<\/ul>.*<p[^>]*>.*<\/p>.*<ul/s);
    });

    it("does not insert separator between different list types", () => {
      const result = normalizeJiraHTML(`<ul><li>Bullets</li></ul><ol><li>Numbers</li></ol>`);

      assertContainsAll(result, ["Bullets", "Numbers"]);
      // No empty paragraph between different list types
      const betweenLists = result.match(/<\/ul>(.*?)<ol/s)?.[1] ?? "";
      expect(betweenLists).not.toContain("</p>");
    });
  });

  // ─── 15. Block spacing / <br> cleanup ─────────────────────────────────

  describe("block spacing and <br> cleanup", () => {
    it("removes leading <br> from paragraphs", () => {
      const result = normalizeJiraHTML(`<p><br/>Actual content here</p>`);

      expect(result).toContain("Actual content here");
      expect(result).not.toMatch(/<br\s*\/?>\s*Actual/);
    });

    it("removes trailing <br> from paragraphs", () => {
      const result = normalizeJiraHTML(`<p>Content here<br/></p>`);

      expect(result).toContain("Content here");
      expect(result).not.toMatch(/Content here\s*<br/);
    });

    it("preserves interior <br> between text (line breaks within a paragraph)", () => {
      const result = normalizeJiraHTML(`<p>Line one<br/>Line two<br/>Line three</p>`);

      assertContainsAll(result, ["Line one", "Line two", "Line three"]);
    });

    it("does not strip whitespace inside pre/code blocks", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre class="code-python">  indented\n    more indented</pre></div></div>`
      );

      assertContainsAll(result, ["  indented", "    more indented"]);
    });

    it("handles Jira's excessive br-padded paragraphs", () => {
      // Jira DC often wraps content like: <p><br/> What:<br/></p>
      const result = normalizeJiraHTML(`<p><br/> What:<br/></p>`);

      expect(result).toContain("What:");
      // Leading/trailing brs should be stripped
      expect(result).not.toMatch(/<p[^>]*>\s*<br/);
    });
  });

  // ─── Integration: realistic Jira issue description ────────────────────

  describe("realistic Jira issue migration", () => {
    it("handles a typical Jira issue description with mixed formatting", () => {
      const jiraHtml = `
        <h2><a name="background"></a>Background</h2>
        <p>The <font color="blue">authentication service</font> needs refactoring.
        See <a class="external-link" href="https://docs.example.com/auth">auth docs</a>.</p>

        <div class="panel" style="background-color: #dfe1e6;">
          <div class="panelContent">
            <p>This is blocked by the SSO migration (assigned to
            <a class="user-hover" href="/secure/ViewProfile.jspa?name=alice">Alice Smith</a>).</p>
          </div>
        </div>

        <h3><a name="steps"></a>Steps to Reproduce</h3>
        <ol>
          <li>Login with OAuth</li>
          <li>Navigate to <tt>/settings</tt></li>
          <li>Click <ins>Save</ins></li>
        </ol>

        <div class="code panel">
          <div class="codeContent panelContent">
            <pre class="code-javascript">fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});</pre>
          </div>
        </div>

        <p><img class="emoticon" alt="(warning)" src="/images/icons/emoticons/warning.gif" /> <font color="red">Do not deploy on Friday!</font></p>

        <table class="confluenceTable">
          <tbody>
            <tr><th class="confluenceTh">Environment</th><th class="confluenceTh">Status</th></tr>
            <tr><td class="confluenceTd">Staging</td><td class="confluenceTd">Ready</td></tr>
            <tr><td class="confluenceTd">Production</td><td class="confluenceTd">Pending</td></tr>
          </tbody>
        </table>
      `;

      const result = normalizeJiraHTML(jiraHtml);

      // Heading anchors stripped, heading text preserved
      expect(result).toContain("Background");
      expect(result).not.toContain('name="background"');
      expect(result).toContain("Steps to Reproduce");

      // Font color converted
      expect(result).toContain("authentication service");
      expect(result).toContain("data-text-color");
      expect(result).not.toContain("<font");

      // External link cleaned
      expect(result).toContain("https://docs.example.com/auth");
      expect(result).not.toContain("external-link");

      // Panel → callout
      expect(result).toContain('data-block-type="callout-component"');
      expect(result).toContain('data-background="light-blue"');

      // User mention
      expect(result).toContain("@Alice Smith");
      expect(result).not.toContain("user-hover");

      // Ordered list content
      assertContainsAll(result, ["Login with OAuth", "/settings", "Save"]);

      // Tag replacements
      expect(result).not.toContain("<tt>");
      expect(result).not.toContain("<ins>");

      // Code block with language
      expect(result).toContain("language-javascript");
      expect(result).toContain("fetch(");

      // Emoticon → emoji
      expect(result).toContain("⚠");

      // Table content without Confluence classes
      assertContainsAll(result, ["Environment", "Status", "Staging", "Production"]);
      assertContainsNone(result, ["confluenceTable", "confluenceTh", "confluenceTd"]);
    });

    it("handles a Jira description with nested lists and multiple panels", () => {
      const jiraHtml = `
        <p>Acceptance Criteria:</p>
        <ul class="alternate" type="square">
          <li>API endpoint returns 200</li>
          <li>Response includes pagination
            <ul>
              <li>next_cursor field</li>
              <li>has_more boolean</li>
            </ul>
          </li>
          <li>Rate limiting headers present</li>
        </ul>

        <div class="panel warningMacroPadding">
          <div class="panelHeader">Breaking Change</div>
          <div class="panelContent">
            <p>The <tt>v1</tt> endpoint will be removed.</p>
          </div>
        </div>

        <div class="panel tipMacroPadding">
          <div class="panelContent">
            <p>Use <tt>cursor</tt> param instead of <tt>offset</tt>.</p>
          </div>
        </div>
      `;

      const result = normalizeJiraHTML(jiraHtml);

      // List items preserved, alternate class removed
      assertContainsAll(result, [
        "API endpoint returns 200",
        "Response includes pagination",
        "next_cursor field",
        "has_more boolean",
        "Rate limiting headers present",
      ]);
      expect(result).not.toContain("alternate");
      expect(result).not.toContain('type="square"');

      // Warning callout with header
      expect(result).toContain('data-background="orange"');
      expect(result).toContain("<strong>Breaking Change</strong>");

      // Tip callout
      expect(result).toContain('data-background="green"');

      // tt → code
      expect(result).not.toContain("<tt>");
      assertContainsAll(result, ["v1", "cursor", "offset"]);
    });
  });

  // ─── Jira DC text effects that pass through Tiptap ────────────────────

  describe("text effects passthrough", () => {
    it("preserves bold text", () => {
      const result = normalizeJiraHTML(`<p><b>Important notice</b></p>`);
      expect(result).toContain("<strong>");
      expect(result).toContain("Important notice");
    });

    it("preserves italic text", () => {
      const result = normalizeJiraHTML(`<p><em>emphasized text</em></p>`);
      expect(result).toContain("<em>");
      expect(result).toContain("emphasized text");
    });

    it("preserves strikethrough/deleted text", () => {
      const result = normalizeJiraHTML(`<p><del>removed feature</del></p>`);
      expect(result).toContain("<s>");
      expect(result).toContain("removed feature");
    });

    it("flattens superscript (not supported by Plane editor schema)", () => {
      const result = normalizeJiraHTML(`<p>E = mc<sup>2</sup></p>`);
      // superscript is stripped by the Tiptap round-trip; content is preserved as plain text
      expect(result).toContain("mc2");
    });

    it("flattens subscript (not supported by Plane editor schema)", () => {
      const result = normalizeJiraHTML(`<p>H<sub>2</sub>O</p>`);
      // subscript is stripped by the Tiptap round-trip; content is preserved as plain text
      expect(result).toContain("H2O");
    });

    it("preserves nested formatting: bold + italic + underline", () => {
      const result = normalizeJiraHTML(`<p><b><em><u>triple styled</u></em></b></p>`);
      assertContainsAll(result, ["<strong>", "<em>", "<u>", "triple styled"]);
    });
  });

  // ─── Blockquotes ({quote} / bq.) ─────────────────────────────────────

  describe("blockquotes", () => {
    it("preserves blockquote content", () => {
      const result = normalizeJiraHTML(
        `<blockquote><p>This is a quoted reply from the original reporter.</p></blockquote>`
      );

      expect(result).toContain("<blockquote");
      expect(result).toContain("This is a quoted reply from the original reporter.");
    });

    it("preserves nested content within blockquote", () => {
      const result = normalizeJiraHTML(`<blockquote><p>First paragraph</p><p>Second paragraph</p></blockquote>`);

      assertContainsAll(result, ["<blockquote", "First paragraph", "Second paragraph"]);
    });
  });

  // ─── Horizontal rules ────────────────────────────────────────────────

  describe("horizontal rules", () => {
    it("strips horizontal rule (not supported by Plane editor schema)", () => {
      const result = normalizeJiraHTML(`<p>Section one</p><hr /><p>Section two</p>`);

      // hr is stripped by the Tiptap round-trip; surrounding content is preserved
      assertContainsAll(result, ["Section one", "Section two"]);
    });
  });

  // ─── Mixed nested lists (bullet inside numbered, vice versa) ──────────

  describe("mixed nested lists", () => {
    it("handles ordered list with nested bullet list", () => {
      const result = normalizeJiraHTML(`
        <ol>
          <li>Step one
            <ul>
              <li>Sub-detail A</li>
              <li>Sub-detail B</li>
            </ul>
          </li>
          <li>Step two</li>
        </ol>
      `);

      assertContainsAll(result, ["Step one", "Sub-detail A", "Sub-detail B", "Step two"]);
    });

    it("handles bullet list with nested numbered list", () => {
      const result = normalizeJiraHTML(`
        <ul>
          <li>Category
            <ol>
              <li>First item</li>
              <li>Second item</li>
            </ol>
          </li>
        </ul>
      `);

      assertContainsAll(result, ["Category", "First item", "Second item"]);
    });
  });

  // ─── Color edge cases ───────────────────────────────────────────────

  describe("color edge cases", () => {
    it("maps purple hex to purple", () => {
      const result = normalizeJiraHTML(`<p><font color="#800080">Purple text</font></p>`);
      expect(result).toContain('data-text-color="purple"');
    });

    it("maps navy/dark blue to dark-blue", () => {
      const result = normalizeJiraHTML(`<p><font color="navy">Navy text</font></p>`);
      expect(result).toContain('data-text-color="dark-blue"');
    });

    it("handles multiple colored spans in one paragraph", () => {
      const result = normalizeJiraHTML(`<p><font color="red">Error</font> and <font color="green">Success</font></p>`);

      assertContainsAll(result, ["Error", "and", "Success", "data-text-color"]);
      expect(result).not.toContain("<font");
    });

    it("handles color around inline code: {color:red}{{method()}}{color}", () => {
      const result = normalizeJiraHTML(`<p><font color="red"><tt>deprecated()</tt></font></p>`);

      // Content is preserved; font and tt tags are replaced
      expect(result).toContain("deprecated()");
      expect(result).not.toContain("<font");
      expect(result).not.toContain("<tt>");
    });
  });

  // ─── Emoticon edge cases ─────────────────────────────────────────────

  describe("emoticon edge cases", () => {
    it("handles multiple emoticons in one paragraph", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(tick)" src="/images/icons/emoticons/check.gif" /> Done <img class="emoticon" alt="(star)" src="/images/icons/emoticons/star.gif" /></p>`
      );

      assertContainsAll(result, ["✅", "Done", "⭐"]);
    });

    it("handles emoticons mixed with text formatting", () => {
      const result = normalizeJiraHTML(
        `<p><b>Status:</b> <img class="emoticon" alt="(tick)" src="/images/icons/emoticons/check.gif" /> Complete</p>`
      );

      assertContainsAll(result, ["<strong>", "Status:", "✅", "Complete"]);
    });

    it("converts error emoticon to ❌", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(error)" src="/images/icons/emoticons/error.gif" /></p>`
      );
      expect(result).toContain("❌");
    });

    it("converts information emoticon to ℹ", () => {
      const result = normalizeJiraHTML(
        `<p><img class="emoticon" alt="(information)" src="/images/icons/emoticons/information.gif" /></p>`
      );
      expect(result).toContain("ℹ");
    });
  });

  // ─── <br> cleanup edge cases ─────────────────────────────────────────

  describe("br cleanup edge cases", () => {
    it("handles multiple consecutive <br> tags", () => {
      const result = normalizeJiraHTML(`<p><br/><br/><br/>Content after breaks</p>`);
      expect(result).toContain("Content after breaks");
    });

    it("handles br inside list items", () => {
      const result = normalizeJiraHTML(`<ul><li><br/>List item text<br/></li></ul>`);
      expect(result).toContain("List item text");
    });

    it("preserves <br> between inline elements mid-paragraph", () => {
      const result = normalizeJiraHTML(`<p><b>Bold line</b><br/><em>Italic line</em></p>`);
      assertContainsAll(result, ["Bold line", "Italic line"]);
    });
  });

  // ─── Tables edge cases ───────────────────────────────────────────────

  describe("table edge cases", () => {
    it("handles table with merged cells (colspan/rowspan)", () => {
      const result = normalizeJiraHTML(
        `<table class="confluenceTable"><tbody>
          <tr><th class="confluenceTh" colspan="2">Wide Header</th></tr>
          <tr><td class="confluenceTd">Left</td><td class="confluenceTd">Right</td></tr>
        </tbody></table>`
      );

      assertContainsAll(result, ["Wide Header", "Left", "Right"]);
      assertContainsNone(result, ["confluenceTable", "confluenceTh", "confluenceTd"]);
    });

    it("handles table with formatted content inside cells", () => {
      const result = normalizeJiraHTML(
        `<table class="confluenceTable"><tbody>
          <tr>
            <td class="confluenceTd"><b>Bold cell</b></td>
            <td class="confluenceTd"><a href="https://example.com">Link cell</a></td>
          </tr>
        </tbody></table>`
      );

      assertContainsAll(result, ["<strong>", "Bold cell", "https://example.com", "Link cell"]);
    });
  });

  // ─── Images edge cases ───────────────────────────────────────────────

  describe("image edge cases", () => {
    it("handles image with thumbnail class", () => {
      const result = normalizeJiraHTML(
        `<p><span class="image-wrap"><a class="confluence-thumbnail-link" href="/attachments/screenshot.png"><img src="/attachments/screenshot_thumb.png" /></a></span></p>`
      );

      expect(result).not.toContain("image-wrap");
      expect(result).not.toContain("confluence-thumbnail-link");
    });

    it("handles multiple images in sequence", () => {
      const result = normalizeJiraHTML(
        `<p><span class="image-wrap"><img src="img1.png" /></span><span class="image-wrap"><img src="img2.png" /></span></p>`
      );

      expect(result).not.toContain("image-wrap");
    });
  });

  // ─── Code block language variants ────────────────────────────────────

  describe("code block languages from Jira DC", () => {
    it("handles SQL code block", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre class="code-sql">SELECT * FROM users WHERE active = true;</pre></div></div>`
      );

      expect(result).toContain("language-sql");
      expect(result).toContain("SELECT * FROM users");
    });

    it("handles XML code block", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre class="code-xml">&lt;root&gt;&lt;child /&gt;&lt;/root&gt;</pre></div></div>`
      );

      expect(result).toContain("language-xml");
    });

    it("handles code block with no language (default Java)", () => {
      const result = normalizeJiraHTML(
        `<div class="code panel"><div class="codeContent panelContent"><pre>int x = 0;</pre></div></div>`
      );

      expect(result).toContain("<pre>");
      expect(result).toContain("int x = 0;");
    });
  });

  // ─── Links edge cases ───────────────────────────────────────────────

  describe("link edge cases", () => {
    it("handles Jira internal issue links", () => {
      const result = normalizeJiraHTML(`<p>See <a href="/browse/PROJ-123" class="issue-link">PROJ-123</a></p>`);

      expect(result).toContain("PROJ-123");
    });

    it("handles anchor links within page", () => {
      const result = normalizeJiraHTML(`<p><a href="#section-2">Jump to section 2</a></p>`);

      expect(result).toContain("Jump to section 2");
    });
  });

  // ─── Panel edge cases ───────────────────────────────────────────────

  describe("panel edge cases", () => {
    it("handles panel with custom bgColor (unrecognized type defaults to tip)", () => {
      const result = normalizeJiraHTML(
        `<div class="panel" style="border-style: dashed; border-color: #ccc; background-color: #e3fcef;">
          <div class="panelContent"><p>Custom styled panel</p></div>
        </div>`
      );

      expect(result).toContain('data-block-type="callout-component"');
      expect(result).toContain("Custom styled panel");
    });

    it("handles panel with multiple paragraphs", () => {
      const result = normalizeJiraHTML(
        `<div class="panel informationMacroPadding">
          <div class="panelContent">
            <p>First paragraph inside panel.</p>
            <p>Second paragraph inside panel.</p>
          </div>
        </div>`
      );

      expect(result).toContain('data-block-type="callout-component"');
      assertContainsAll(result, ["First paragraph inside panel.", "Second paragraph inside panel."]);
    });

    it("handles panel with a list inside", () => {
      const result = normalizeJiraHTML(
        `<div class="panel tipMacroPadding">
          <div class="panelContent">
            <ul><li>Step 1</li><li>Step 2</li></ul>
          </div>
        </div>`
      );

      expect(result).toContain('data-block-type="callout-component"');
      assertContainsAll(result, ["Step 1", "Step 2"]);
    });
  });

  // ─── Deeply nested / complex real-world Jira DC content ──────────────

  describe("complex real-world Jira DC content", () => {
    it("handles a bug report with environment details, repro steps, and logs", () => {
      const jiraHtml = `
        <h3><a name="env"></a>Environment</h3>
        <table class="confluenceTable">
          <tbody>
            <tr><th class="confluenceTh">Component</th><th class="confluenceTh">Version</th></tr>
            <tr><td class="confluenceTd">API Server</td><td class="confluenceTd">v2.4.1</td></tr>
            <tr><td class="confluenceTd">Database</td><td class="confluenceTd">PostgreSQL 15.2</td></tr>
          </tbody>
        </table>

        <h3>Steps to Reproduce</h3>
        <ol>
          <li>Create a new project with <tt>POST /api/v1/projects</tt></li>
          <li>Add members:
            <ul>
              <li><a class="user-hover" href="/user/alice">Alice</a> as admin</li>
              <li><a class="user-hover" href="/user/bob">Bob</a> as member</li>
            </ul>
          </li>
          <li>Navigate to <font color="blue">/settings/members</font></li>
        </ol>

        <div class="panel warningMacroPadding">
          <div class="panelHeader">Important</div>
          <div class="panelContent">
            <p><img class="emoticon" alt="(warning)" src="/images/icons/emoticons/warning.gif" /> This only reproduces on <ins>production</ins> data.</p>
          </div>
        </div>

        <h3>Error Log</h3>
        <div class="code panel">
          <div class="codeContent panelContent">
            <pre class="code-bash">ERROR 2024-01-15T10:30:00Z [api] PermissionError: User lacks PROJECT_ADMIN role
    at validatePermission (auth.ts:142)
    at addMember (members.ts:89)</pre>
          </div>
        </div>

        <p><font color="red"><b>Severity: Critical</b></font> <img class="emoticon" alt="(cross)" src="/images/icons/emoticons/error.gif" /></p>

        <blockquote><p>Customer impact: 15 enterprise accounts affected. Priority escalation requested by <cite>Support Team Lead</cite>.</p></blockquote>
      `;

      const result = normalizeJiraHTML(jiraHtml);

      // Headings cleaned
      expect(result).toContain("Environment");
      expect(result).not.toContain('name="env"');

      // Table cleaned
      assertContainsAll(result, ["API Server", "v2.4.1", "PostgreSQL 15.2"]);
      expect(result).not.toContain("confluenceTable");

      // Ordered list with mixed content
      expect(result).toContain("Create a new project");
      expect(result).not.toContain("<tt>");

      // Nested user mentions
      expect(result).toContain("@Alice");
      expect(result).toContain("@Bob");
      expect(result).not.toContain("user-hover");

      // Color in list
      expect(result).toContain("data-text-color");
      expect(result).toContain("/settings/members");
      expect(result).not.toContain("<font");

      // Warning panel with header
      expect(result).toContain('data-background="orange"');
      expect(result).toContain("<strong>Important</strong>");

      // Emoticon inside panel
      expect(result).toContain("⚠");

      // ins → u
      expect(result).not.toContain("<ins>");
      expect(result).toContain("<u>");

      // Code block with bash
      expect(result).toContain("language-bash");
      expect(result).toContain("PermissionError");

      // Bold + color in paragraph
      expect(result).toContain("Severity: Critical");

      // Cross emoticon
      expect(result).toContain("❌");

      // Blockquote preserved
      expect(result).toContain("<blockquote");
      expect(result).toContain("15 enterprise accounts affected");

      // cite → em
      expect(result).not.toContain("<cite>");
      expect(result).toContain("<em>");
    });
  });

  // ─── Regression: oracle-identified gaps ──────────────────────────────

  describe("heading anchor with visible text (regression)", () => {
    it("preserves heading text when anchor wraps visible content", () => {
      const result = normalizeJiraHTML('<h2><a name="section">Overview</a></h2>');

      expect(result).toContain("Overview");
      expect(result).not.toContain('name="section"');
    });

    it("preserves heading text for empty anchor followed by text", () => {
      const result = normalizeJiraHTML('<h3><a name="details"></a>Implementation Details</h3>');

      expect(result).toContain("Implementation Details");
    });
  });

  describe("panel detection case-insensitivity (regression)", () => {
    it("detects info panel with uppercase hex in style", () => {
      const result = normalizeJiraHTML(
        '<div class="panel" style="background-color: #DFE1E6;"><div class="panelContent"><p>Info</p></div></div>'
      );

      expect(result).toContain('data-background="light-blue"');
    });

    it("detects warning panel with mixed-case hex", () => {
      const result = normalizeJiraHTML(
        '<div class="panel" style="background-color: #FFFAE6;"><div class="panelContent"><p>Warning</p></div></div>'
      );

      expect(result).toContain('data-background="orange"');
    });
  });

  describe("interior <br> structural preservation", () => {
    it("preserves hard breaks between text lines", () => {
      const result = normalizeJiraHTML("<p>Line 1<br/>Line 2<br/>Line 3</p>");

      assertContainsAll(result, ["Line 1", "Line 2", "Line 3"]);
      const brCount = (result.match(/<br/g) || []).length;
      expect(brCount).toBe(2);
    });
  });

  describe("relative Jira URLs", () => {
    it("preserves relative link href for internal Jira issue", () => {
      const result = normalizeJiraHTML('<p>Related: <a href="/browse/PROJ-456" class="issue-link">PROJ-456</a></p>');

      expect(result).toContain('href="/browse/PROJ-456"');
      expect(result).toContain("PROJ-456");
    });

    it("preserves relative image src for Jira attachment", () => {
      const result = normalizeJiraHTML('<p><img src="/secure/attachment/12345/screenshot.png" /></p>');

      expect(result).toContain("/secure/attachment/12345/screenshot.png");
    });
  });
});
