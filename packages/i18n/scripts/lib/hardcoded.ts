/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import ts from "typescript";

/** JSX attributes whose string values are shown to users. */
const JSX_ATTRS = new Set([
  "placeholder",
  "title",
  "label",
  "aria-label",
  "alt",
  "description",
  "tooltipContent",
  "tooltipHeading",
  "message",
  "subtitle",
  "subTitle",
  "heading",
  "helperText",
  "buttonText",
  "primaryButtonText",
  "secondaryButtonText",
  "emptyText",
  "noOptionsMessage",
  "text",
  "header",
  "content",
  "hint",
  "errorMessage",
  "caption",
  "loadingText",
  "confirmText",
  "cancelText",
]);

/** Object property names whose string values are shown to users. */
const OBJECT_KEYS = new Set([
  "title",
  "message",
  "label",
  "description",
  "placeholder",
  "subtitle",
  "subTitle",
  "heading",
  "tooltip",
  "helperText",
  "text",
  "buttonText",
  "errorMessage",
]);

const IGNORE_MARKER = "i18n-ignore:";

/** Repo-relative paths the scan covers: frontend `.ts`/`.tsx` minus tests, stories, scripts and non-UI packages. */
export function isScannedFile(file: string): boolean {
  if (!/^(apps\/(web|admin|space)|packages)\//.test(file)) return false;
  if (!/\.tsx?$/.test(file) || /\.(test|spec|stories|d)\.tsx?$/.test(file)) return false;
  return !/(__tests__|\/tests?\/|\/scripts\/|^packages\/(i18n|codemods)\/)/.test(file);
}

/** True when a string reads as human-facing copy rather than a key, slug, constant, URL or identifier. */
export function isHumanText(raw: string): boolean {
  const s = raw.trim();
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (/^[a-z0-9_.:\-/]+$/.test(s)) return false; // i18n key, slug, class name, path
  if (/^[A-Z0-9_]+$/.test(s)) return false; // CONSTANT
  if (/^(https?:|\/|#|\.|@)/.test(s)) return false; // URL, path, selector, handle
  if (/^[a-z]+[A-Z]\w*$/.test(s)) return false; // camelCase identifier
  return /\s/.test(s) || /^[A-Z][a-z]+/.test(s);
}

export interface Hit {
  file: string;
  line: number;
  text: string;
}

/** Find hardcoded user-facing strings in one source file. */
export function scanSource(file: string, source: string): Hit[] {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const lines = source.split("\n");
  const hits: Hit[] = [];

  const add = (node: ts.Node, text: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    // Escape hatch: marker on the same line or the line above.
    if (lines[line - 1]?.includes(IGNORE_MARKER) || lines[line - 2]?.includes(IGNORE_MARKER)) return;
    hits.push({ file, line, text: text.trim().replace(/\s+/g, " ") });
  };

  // Collect string literals from an expression, following ternary and ||/??/&& arms.
  const literals = (e: ts.Expression | undefined) => {
    if (!e) return;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
      if (isHumanText(e.text)) add(e, e.text);
    } else if (ts.isTemplateExpression(e)) {
      const parts = [e.head.text, ...e.templateSpans.map((span) => span.literal.text)];
      if (isHumanText(parts.join(""))) add(e, parts.join("{}"));
    } else if (ts.isConditionalExpression(e)) {
      literals(e.whenTrue);
      literals(e.whenFalse);
    } else if (ts.isBinaryExpression(e)) {
      const op = e.operatorToken.kind;
      if (op === ts.SyntaxKind.BarBarToken || op === ts.SyntaxKind.QuestionQuestionToken) {
        literals(e.left);
        literals(e.right);
      } else if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
        literals(e.right); // `cond && "text"`: only the right arm renders
      }
    } else if (ts.isParenthesizedExpression(e)) {
      literals(e.expression);
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      if (isHumanText(node.text)) add(node, node.text);
    } else if (ts.isJsxExpression(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      literals(node.expression);
    } else if (ts.isJsxAttribute(node) && JSX_ATTRS.has(node.name.getText(sf))) {
      const init = node.initializer;
      if (init) literals(ts.isJsxExpression(init) ? init.expression : init);
    } else if (ts.isPropertyAssignment(node) && OBJECT_KEYS.has(node.name.getText(sf).replace(/['"]/g, ""))) {
      literals(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

export type Counts = Record<string, number>;

export interface Regression {
  file: string;
  baseline: number;
  current: number;
}

/** Files whose hit count is above their baseline count (a missing baseline entry counts as 0). */
export function findRegressions(baseline: Counts, current: Counts): Regression[] {
  return Object.entries(current)
    .filter(([file, n]) => n > (baseline[file] ?? 0))
    .map(([file, n]) => ({ file, baseline: baseline[file] ?? 0, current: n }))
    .toSorted((a, b) => a.file.localeCompare(b.file));
}
