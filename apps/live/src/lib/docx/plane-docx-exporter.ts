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

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { Document, Packer, Paragraph, Table, TextRun } from "docx";
import type { FileChild } from "docx";
import type { TipTapDocument, TipTapNode } from "@/lib/export-core";
import { walkTipTapDocument } from "@/lib/export-core";
import { docxNodeTransformers } from "./node-transformers";
import { numberingConfig, DEFAULT_FONT, DEFAULT_FONT_SIZE, paragraphStyles, characterStyles } from "./styles";
import type { DocxExportOptions, DocxRenderContext } from "./types";
import { ensureMathJaxReady } from "./utils/math";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getFontsDir = (): string => {
  const prodFontsDir = path.join(__dirname, "assets/fonts");
  const devFontsDir = path.resolve(__dirname, "../../../assets/fonts");

  if (__dirname.includes("/dist")) {
    return prodFontsDir;
  }
  return devFontsDir;
};

const loadFontBuffers = (): { name: string; data: Buffer }[] => {
  try {
    const fontsDir = getFontsDir();
    return [
      { name: "Inter", data: fs.readFileSync(path.join(fontsDir, "inter-latin-400-normal.woff")) },
      { name: "Inter", data: fs.readFileSync(path.join(fontsDir, "inter-latin-600-normal.woff")) },
      { name: "Inter", data: fs.readFileSync(path.join(fontsDir, "inter-latin-700-normal.woff")) },
    ];
  } catch {
    return [];
  }
};

export const renderPlaneDocToDocxBuffer = async (
  contentJSON: TipTapDocument,
  options: DocxExportOptions = {}
): Promise<Buffer> => {
  const { title, author, subject, metadata, noAssets } = options;

  await ensureMathJaxReady();

  const ctx: DocxRenderContext = {
    metadata: metadata ? { ...metadata, noAssets } : noAssets ? { noAssets } : undefined,
  };

  const bodyChildren = walkTipTapDocument<
    Paragraph | Table | import("docx").TableRow | import("docx").TableCell,
    DocxRenderContext
  >(contentJSON as TipTapNode, {
    renderers: docxNodeTransformers,
    ctx,
    fallback: (_node, children) => children,
  }) as FileChild[];

  const sections = [];

  if (title) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 48,
            font: { name: DEFAULT_FONT },
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  const doc = new Document({
    fonts: loadFontBuffers(),
    title,
    creator: author,
    subject,
    numbering: numberingConfig,
    sections: [
      {
        properties: {},
        children: [...sections, ...bodyChildren],
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: { name: DEFAULT_FONT },
            size: DEFAULT_FONT_SIZE,
          },
        },
      },
      paragraphStyles,
      characterStyles,
    },
  });

  const rawBuffer = Buffer.from(await Packer.toBuffer(doc));
  return sanitizeDocxRelationshipIds(rawBuffer);
};

/**
 * The `docx` npm package uses nanoid with urlAlphabet (includes `-` and `_`)
 * for relationship IDs. This violates the OOXML spec (xsd:ID must be
 * alphanumeric), causing Word Online to reject the file. Desktop Word is
 * more forgiving. This function replaces invalid characters in all rId values
 * across .rels and .xml files inside the DOCX ZIP.
 */
const sanitizeDocxRelationshipIds = async (buffer: Buffer): Promise<Buffer> => {
  const zip = await JSZip.loadAsync(buffer);
  const idMap = new Map<string, string>();
  let counter = 0;

  const collectIds = (content: string): void => {
    const matches = content.matchAll(/rId([A-Za-z0-9_-]+)/g);
    for (const match of matches) {
      const full = match[0];
      if (/[-_]/.test(full)) {
        if (!idMap.has(full)) {
          idMap.set(full, `rIdR${++counter}`);
        }
      }
    }
  };

  const replaceIds = (content: string): string => {
    let result = content;
    for (const [original, sanitized] of idMap) {
      result = result.replaceAll(original, sanitized);
    }
    return result;
  };

  const xmlFiles = Object.keys(zip.files).filter((name) => name.endsWith(".xml") || name.endsWith(".rels"));

  for (const fileName of xmlFiles) {
    const content = await zip.file(fileName)!.async("string");
    collectIds(content);
  }

  if (idMap.size === 0) return buffer;

  for (const fileName of xmlFiles) {
    const content = await zip.file(fileName)!.async("string");
    const sanitized = replaceIds(content);
    if (sanitized !== content) {
      zip.file(fileName, sanitized);
    }
  }

  const result = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return Buffer.from(result);
};
