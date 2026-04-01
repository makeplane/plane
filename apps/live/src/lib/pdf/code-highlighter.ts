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

import { getHighlighter, loadLanguage, resolveLanguage } from "@plane/editor/lib";
import type { TipTapDocument, TipTapNode } from "./types";

const PDF_CODE_THEME = "github-light";

export type PDFHighlightedCodeToken = {
  content: string;
  color?: string;
  backgroundColor?: string;
  fontStyle?: number;
};

export type PDFHighlightedCodeBlock = {
  lines: PDFHighlightedCodeToken[][];
  textColor?: string;
};

type HighlightedTokenLike = {
  content: string;
  color?: string;
  bgColor?: string;
  fontStyle?: number;
};

const normalizeLanguage = (language: string | null | undefined): string | null => {
  if (!language) {
    return null;
  }

  const normalizedLanguage = resolveLanguage(language.trim());
  return normalizedLanguage || null;
};

const getCodeBlockText = (node: TipTapNode): string => node.content?.map((child) => child.text || "").join("") || "";

const mapHighlightedToken = (token: HighlightedTokenLike): PDFHighlightedCodeToken => ({
  content: token.content,
  color: token.color,
  backgroundColor: token.bgColor,
  fontStyle: token.fontStyle,
});

const annotateCodeBlockNode = async (node: TipTapNode): Promise<TipTapNode> => {
  const codeContent = getCodeBlockText(node);
  const requestedLanguage = normalizeLanguage(typeof node.attrs?.language === "string" ? node.attrs.language : null);

  if (!codeContent || !requestedLanguage) {
    return node;
  }

  try {
    const language = await loadLanguage(requestedLanguage);
    const highlighter = await getHighlighter();
    const highlightedTokens = highlighter.codeToTokens(codeContent, { lang: language, theme: PDF_CODE_THEME });

    return {
      ...node,
      attrs: {
        ...node.attrs,
        _highlightedCodeBlock: {
          lines: highlightedTokens.tokens.map((line: HighlightedTokenLike[]) => line.map(mapHighlightedToken)),
          textColor: highlightedTokens.fg,
        } satisfies PDFHighlightedCodeBlock,
      },
    };
  } catch {
    return node;
  }
};

const annotateNodeForPdf = async (node: TipTapNode): Promise<TipTapNode> => {
  const content = node.content ? await Promise.all(node.content.map(annotateNodeForPdf)) : node.content;
  const nextNode = content === node.content ? node : { ...node, content };

  if (nextNode.type !== "codeBlock") {
    return nextNode;
  }

  return annotateCodeBlockNode(nextNode);
};

export const annotateCodeBlocksForPdf = async (doc: TipTapDocument): Promise<TipTapDocument> => ({
  ...doc,
  content: doc.content ? await Promise.all(doc.content.map(annotateNodeForPdf)) : doc.content,
});
