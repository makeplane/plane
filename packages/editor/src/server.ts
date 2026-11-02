/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Node entry: tiptap v3's default HTML codec needs a browser `window`, so swap in its happy-dom codec.
export * from "./lib";
import { generateHTML, generateJSON } from "@tiptap/html/server";
import { createDocumentCodecs } from "./helpers/document-codecs";

export const {
  TITLE_EDITOR_EXTENSIONS,
  applyUpdates,
  convertBinaryDataToBase64String,
  convertBase64StringToBinaryData,
  getBinaryDataFromRichTextEditorHTMLString,
  generateTitleProsemirrorJson,
  getBinaryDataFromDocumentEditorHTMLString,
  getAllDocumentFormatsFromRichTextEditorBinaryData,
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  convertHTMLDocumentToAllFormats,
  extractTextFromHTML,
} = createDocumentCodecs({ generateHTML, generateJSON });
