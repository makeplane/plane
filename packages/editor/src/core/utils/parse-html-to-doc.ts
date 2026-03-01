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

import type { JSONContent } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";

/**
 * Parses an HTML string into a ProseMirror JSON document using
 * the ProseMirror DOMParser directly, bypassing TipTap's
 * `elementFromString` helper which can corrupt code blocks
 * containing indented content with blank lines.
 */
export function parseHTMLToJSON(html: string, schema: Schema): JSONContent {
  const dom = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body;
  const parser = ProseMirrorDOMParser.fromSchema(schema);
  const doc = parser.parse(dom, { preserveWhitespace: "full" });
  return doc.toJSON();
}
