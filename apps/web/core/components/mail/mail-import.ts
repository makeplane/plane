/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });

const MARKDOWN_EXTENSIONS = new Set(["md", "markdown"]);
const HTML_EXTENSIONS = new Set(["html", "htm"]);

const fileExtension = (filename: string) => filename.split(".").pop()?.toLowerCase() ?? "";

export const isImportableMailFile = (filename: string) => {
  const extension = fileExtension(filename);
  return MARKDOWN_EXTENSIONS.has(extension) || HTML_EXTENSIONS.has(extension);
};

/**
 * Reads an .html/.htm or .md/.markdown file and returns sanitized HTML ready
 * to drop into the compose editor. Markdown is rendered to HTML first; the
 * result is always passed through DOMPurify since it is about to be assigned
 * to a live contentEditable via innerHTML.
 */
export const convertMailFileToHtml = async (file: File): Promise<string> => {
  const extension = fileExtension(file.name);
  const raw = await file.text();
  const html = MARKDOWN_EXTENSIONS.has(extension) ? markdown.render(raw) : raw;
  return DOMPurify.sanitize(html);
};
