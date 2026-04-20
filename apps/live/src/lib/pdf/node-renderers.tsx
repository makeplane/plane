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

import { Image, Link, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactElement, ReactNode } from "react";
import { CORE_EXTENSIONS, EDrawioMode } from "@plane/editor";
import { BACKGROUND_COLORS, EDITOR_BACKGROUND_COLORS, resolveColorForPdf, TEXT_COLORS } from "./colors";
import { getFontStyle } from "./fonts";
import type { PDFHighlightedCodeBlock, PDFHighlightedCodeToken } from "./code-highlighter";
import {
  CheckIcon,
  ClipboardIcon,
  DiagramIcon,
  DocumentIcon,
  FileIcon,
  GlobeIcon,
  LightbulbIcon,
  LinkIcon,
  TaskIcon,
} from "./icons";
import { getEmojiTextFromName, normalizeTextForPdfEmojiAssets, resolveStoredEmojiAssetSource } from "./emoji-assets";
import { applyMarks } from "./mark-renderers";
import { pdfStyles } from "./styles";
import type { KeyGenerator, NodeRendererRegistry, PDFExportMetadata, PDFRenderContext, TipTapNode } from "./types";

const getCalloutIcon = (node: TipTapNode, color: string, metadata?: PDFExportMetadata): ReactElement => {
  const logoInUse = node.attrs?.["data-logo-in-use"] as string | undefined;
  const iconName = node.attrs?.["data-icon-name"] as string | undefined;
  const iconColor = (node.attrs?.["data-icon-color"] as string) || color;

  if (logoInUse === "emoji") {
    const emojiUnicode = node.attrs?.["data-emoji-unicode"] as string | undefined;
    const localEmojiAssetSource = resolveStoredEmojiAssetSource(emojiUnicode);

    if (!metadata?.noAssets && localEmojiAssetSource) {
      return <Image src={localEmojiAssetSource} style={pdfStyles.calloutEmoji} />;
    }

    return <LightbulbIcon size={16} color={iconColor} />;
  }

  if (iconName) {
    switch (iconName) {
      case "FileText":
      case "File":
        return <DocumentIcon size={16} color={iconColor} />;
      case "Link":
        return <LinkIcon size={16} color={iconColor} />;
      case "Globe":
        return <GlobeIcon size={16} color={iconColor} />;
      case "Clipboard":
        return <ClipboardIcon size={16} color={iconColor} />;
      case "CheckSquare":
      case "Check":
        return <CheckIcon size={16} color={iconColor} />;
      case "Lightbulb":
      default:
        return <LightbulbIcon size={16} color={iconColor} />;
    }
  }

  return <LightbulbIcon size={16} color={color} />;
};

export const createKeyGenerator = (): KeyGenerator => {
  let counter = 0;
  return () => `node-${counter++}`;
};

const PDF_BREAK_OPPORTUNITY = "\u200B";
const BREAKABLE_TOKEN_PATTERN = /[^\s]{8,}/g;
const TOKEN_BREAK_DELIMITER_PATTERN = /([/@._?#=&%:+~-])/g;
const MAX_UNBROKEN_TABLE_SEGMENT_LENGTH = 12;
const TABLE_SEGMENT_BREAK_CHUNK_SIZE = 6;
const MIN_TABLE_SCALE_RATIO = 0.44;

const insertPdfBreaksIntoLongSegment = (segment: string): string => {
  const characters = Array.from(segment);

  if (characters.length < MAX_UNBROKEN_TABLE_SEGMENT_LENGTH) {
    return segment;
  }

  return characters.reduce((result, character, index) => {
    if (index > 0 && index % TABLE_SEGMENT_BREAK_CHUNK_SIZE === 0) {
      return `${result}${PDF_BREAK_OPPORTUNITY}${character}`;
    }

    return `${result}${character}`;
  }, "");
};

export const insertPdfBreakOpportunities = (text: string | undefined): string => {
  if (!text) return "";

  return text.replace(BREAKABLE_TOKEN_PATTERN, (token) => {
    const tokenWithDelimiterBreaks = token.replace(TOKEN_BREAK_DELIMITER_PATTERN, `$1${PDF_BREAK_OPPORTUNITY}`);

    return tokenWithDelimiterBreaks
      .split(PDF_BREAK_OPPORTUNITY)
      .map(insertPdfBreaksIntoLongSegment)
      .join(PDF_BREAK_OPPORTUNITY);
  });
};

const PDF_APOSTROPHE_NORMALIZATION_PATTERN = /[\u2018\u2019]/g;

const normalizePdfTypography = (text: string): string => text.replace(PDF_APOSTROPHE_NORMALIZATION_PATTERN, "'");

const getDisplayText = (text: string | undefined, shouldInsertBreaks: boolean): string => {
  const normalizedText = normalizePdfTypography(normalizeTextForPdfEmojiAssets(text));
  return shouldInsertBreaks ? insertPdfBreakOpportunities(normalizedText) : normalizedText;
};

const DEFAULT_TABLE_COLUMN_WIDTH = 150;

const getPositiveColumnWidths = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((width) => (typeof width === "number" ? width : Number.parseFloat(String(width))))
    .filter((width) => Number.isFinite(width) && width > 0);
};

const getCellColspan = (node: TipTapNode): number => {
  const colspan = node.attrs?.colspan;
  return typeof colspan === "number" && colspan > 0 ? colspan : 1;
};

const getResolvedNodeColors = (node: TipTapNode): Style => {
  const precomputedColorStyle = node.attrs?._resolvedColorStyle;
  if (precomputedColorStyle && typeof precomputedColorStyle === "object") {
    return precomputedColorStyle as Style;
  }

  const background = node.attrs?.background;
  const textColor = node.attrs?.textColor;
  const resolvedBackground = typeof background === "string" ? resolveColorForPdf(background, "background") : null;
  const resolvedTextColor = typeof textColor === "string" ? resolveColorForPdf(textColor, "text") : null;

  return {
    ...(resolvedBackground ? { backgroundColor: resolvedBackground } : {}),
    ...(resolvedTextColor ? { color: resolvedTextColor } : {}),
  };
};

const getTableColumnWidths = (tableNode: TipTapNode): number[] => {
  const columnWidths: number[] = [];
  let activeRowSpans = new Map<number, number>();

  for (const row of tableNode.content ?? []) {
    let columnIndex = 0;
    const nextActiveRowSpans = new Map<number, number>();

    for (const [activeColumnIndex, remainingRows] of activeRowSpans.entries()) {
      if (remainingRows > 1) {
        nextActiveRowSpans.set(activeColumnIndex, remainingRows - 1);
      }
    }

    for (const cell of row.content ?? []) {
      while (activeRowSpans.has(columnIndex)) {
        columnIndex += 1;
      }

      const colspan = getCellColspan(cell);
      const rowspan = typeof cell.attrs?.rowspan === "number" && cell.attrs.rowspan > 1 ? cell.attrs.rowspan : 1;
      const colwidth = getPositiveColumnWidths(cell.attrs?.colwidth);

      for (let offset = 0; offset < colspan; offset++) {
        const width = colwidth[offset] ?? colwidth[colwidth.length - 1] ?? DEFAULT_TABLE_COLUMN_WIDTH;

        if (!columnWidths[columnIndex + offset]) {
          columnWidths[columnIndex + offset] = width;
        }
      }

      if (rowspan > 1) {
        for (let offset = 0; offset < colspan; offset++) {
          nextActiveRowSpans.set(columnIndex + offset, rowspan - 1);
        }
      }

      columnIndex += colspan;
    }

    activeRowSpans = nextActiveRowSpans;
  }

  return columnWidths.map((width) => width || DEFAULT_TABLE_COLUMN_WIDTH);
};

const formatPdfPercentage = (value: number): string =>
  `${value
    .toFixed(4)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1")}%`;

const isTableHeaderRow = (rowNode: TipTapNode): boolean => {
  const rowCells = rowNode.content ?? [];

  return (
    rowCells.length > 0 && rowCells.every((child) => (child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.TABLE_HEADER)
  );
};

const getTableWidthPercentage = (
  tableColumnWidths: number[],
  pageContentWidth: number | undefined
): string | undefined => {
  if (!pageContentWidth || pageContentWidth <= 0 || tableColumnWidths.length === 0) {
    return undefined;
  }

  const totalTableWidth = tableColumnWidths.reduce((total, width) => total + width, 0);
  if (totalTableWidth <= 0) {
    return undefined;
  }

  const fitScaleRatio = Math.min(pageContentWidth / totalTableWidth, 1);
  const appliedScaleRatio = fitScaleRatio >= MIN_TABLE_SCALE_RATIO ? fitScaleRatio : MIN_TABLE_SCALE_RATIO;

  return formatPdfPercentage((totalTableWidth * appliedScaleRatio * 100) / pageContentWidth);
};

const getTableCellLayoutStyle = (node: TipTapNode): Style => {
  const colspan = getCellColspan(node);
  const tableColumnWidths = getPositiveColumnWidths(node.attrs?._tableColumnWidths);
  const columnStartIndex =
    typeof node.attrs?._tableColumnStartIndex === "number" ? node.attrs._tableColumnStartIndex : 0;

  const explicitColumnWidths = tableColumnWidths.slice(columnStartIndex, columnStartIndex + colspan);
  const fallbackWidths = getPositiveColumnWidths(node.attrs?.colwidth);
  const resolvedCellWidth =
    explicitColumnWidths.reduce((total, width) => total + width, 0) ||
    fallbackWidths.reduce((total, width) => total + width, 0) ||
    colspan * DEFAULT_TABLE_COLUMN_WIDTH;

  if (tableColumnWidths.length === 0) {
    return {
      flexBasis: 0,
      flexGrow: resolvedCellWidth,
      flexShrink: 1,
    };
  }

  const resolvedTableWidth = tableColumnWidths.reduce((total, width) => total + width, 0) || resolvedCellWidth;
  const widthPercentage = formatPdfPercentage((resolvedCellWidth / resolvedTableWidth) * 100);

  return {
    width: widthPercentage,
    maxWidth: widthPercentage,
    minWidth: 0,
    flexGrow: 0,
    flexShrink: 0,
  };
};

const renderTextWithMarks = (node: TipTapNode, getKey: KeyGenerator): ReactElement => {
  const baseStyle = node.attrs?._isInsideTableCell === true ? pdfStyles.tableText : {};
  const style = applyMarks(node.marks, baseStyle);
  const textContent = getDisplayText(node.text, node.attrs?._isInsideTableCell === true);
  const fontStyle = getFontStyle(node.text);
  const hasLink = node.marks?.find((m) => m.type === "link");

  if (hasLink) {
    const href = (hasLink.attrs?.href as string) || "#";
    return (
      <Link key={getKey()} src={href} style={{ ...fontStyle, ...pdfStyles.link, ...style }}>
        {textContent}
      </Link>
    );
  }

  return (
    <Text key={getKey()} style={{ ...fontStyle, ...style }}>
      {textContent}
    </Text>
  );
};

const getTextAlignStyle = (textAlign: string | null | undefined): Style => {
  if (!textAlign) return {};
  return {
    textAlign: textAlign as "left" | "right" | "center" | "justify",
  };
};

const getFlexAlignStyle = (textAlign: string | null | undefined): Style => {
  if (!textAlign) return {};
  if (textAlign === "right") return { alignItems: "flex-end" };
  if (textAlign === "center") return { alignItems: "center" };
  return {};
};

const isTableCellParent = (parentType: string | undefined): boolean =>
  parentType === CORE_EXTENSIONS.TABLE_CELL || parentType === CORE_EXTENSIONS.TABLE_HEADER;

const getCompactTableBlockStyle = (parentType: string | undefined): Style =>
  isTableCellParent(parentType)
    ? {
        marginTop: 0,
        marginBottom: 0,
      }
    : {};

type ActiveRowSpanEntry = {
  sourceId: string;
  remainingRows: number;
  cellType: string;
  colorStyle: Style;
};

const mergeColorStyles = (...styles: Style[]): Style =>
  styles.reduce<Style>((mergedStyle, style) => ({ ...mergedStyle, ...style }), {});

const decrementActiveRowSpans = (activeRowSpans: Map<number, ActiveRowSpanEntry>): Map<number, ActiveRowSpanEntry> => {
  const nextActiveRowSpans = new Map<number, ActiveRowSpanEntry>();

  for (const [columnIndex, rowSpanEntry] of activeRowSpans.entries()) {
    if (rowSpanEntry.remainingRows > 1) {
      nextActiveRowSpans.set(columnIndex, {
        ...rowSpanEntry,
        remainingRows: rowSpanEntry.remainingRows - 1,
      });
    }
  }

  return nextActiveRowSpans;
};

const getTableCellExtraStyles = (node: TipTapNode): Style[] => {
  const extraStyles: Style[] = [];

  if (node.attrs?._isRowSpanPlaceholder === true) {
    extraStyles.push(pdfStyles.tableCellPlaceholder);
  }

  if (node.attrs?._rowspanContinues === true) {
    extraStyles.push({ borderBottomWidth: 0 });
  }

  return extraStyles;
};

const MARKDOWN_TASK_PREFIX_PATTERN = /^\s*\[( |x|X)\]\s*/;
const CODE_TOKEN_FONT_STYLE = {
  italic: 1,
  bold: 2,
  underline: 4,
  strikethrough: 8,
} as const;

const getOrderedListMarker = (index: number): string => `${index}.`;

const getCodeTokenStyle = (token: PDFHighlightedCodeToken, fallbackColor: string | undefined): Style => ({
  ...(token.color || fallbackColor ? { color: token.color ?? fallbackColor } : {}),
  ...(token.backgroundColor ? { backgroundColor: token.backgroundColor } : {}),
  ...(token.fontStyle && token.fontStyle & CODE_TOKEN_FONT_STYLE.bold ? { fontWeight: 600 } : {}),
  ...(token.fontStyle && token.fontStyle & CODE_TOKEN_FONT_STYLE.italic ? { fontStyle: "italic" } : {}),
  ...(token.fontStyle && token.fontStyle & CODE_TOKEN_FONT_STYLE.strikethrough
    ? { textDecoration: "line-through" }
    : token.fontStyle && token.fontStyle & CODE_TOKEN_FONT_STYLE.underline
      ? { textDecoration: "underline" }
      : {}),
});

const renderHighlightedCodeBlock = (
  codeContent: string,
  highlightedCodeBlock: PDFHighlightedCodeBlock,
  ctx: PDFRenderContext
): ReactElement[] =>
  highlightedCodeBlock.lines.map((line) => {
    const lineChildren =
      line.length === 0 || line.every((token) => token.content.length === 0)
        ? "\u00A0"
        : line.map((token) => (
            <Text key={ctx.getKey()} style={getCodeTokenStyle(token, highlightedCodeBlock.textColor)}>
              {token.content}
            </Text>
          ));

    return (
      <Text
        key={ctx.getKey()}
        style={{
          ...getFontStyle(codeContent),
          ...pdfStyles.codeBlockText,
          ...(highlightedCodeBlock.textColor ? { color: highlightedCodeBlock.textColor } : {}),
        }}
      >
        {lineChildren}
      </Text>
    );
  });

const getMarkdownTaskState = (node: TipTapNode): boolean | null => {
  const [firstChild] = node.content ?? [];
  const [firstTextNode] = firstChild?.content ?? [];
  const textContent = typeof firstTextNode?.text === "string" ? firstTextNode.text : null;
  if (!textContent) {
    return null;
  }

  const markerMatch = textContent.match(MARKDOWN_TASK_PREFIX_PATTERN);
  if (!markerMatch) {
    return null;
  }

  return markerMatch[1].toLowerCase() === "x";
};

const stripMarkdownTaskPrefixFromListItem = (node: TipTapNode): TipTapNode => {
  const [firstChild, ...remainingChildren] = node.content ?? [];
  const [firstTextNode, ...remainingTextNodes] = firstChild?.content ?? [];

  if (!firstChild || !firstTextNode || typeof firstTextNode.text !== "string") {
    return node;
  }

  return {
    ...node,
    content: [
      {
        ...firstChild,
        content: [
          {
            ...firstTextNode,
            text: firstTextNode.text.replace(MARKDOWN_TASK_PREFIX_PATTERN, ""),
          },
          ...remainingTextNodes,
        ],
      },
      ...remainingChildren,
    ],
  };
};

const getImageAlignmentStyle = (alignment: string): Style =>
  alignment === "center"
    ? { alignItems: "center" as const }
    : alignment === "right"
      ? { alignItems: "flex-end" as const }
      : { alignItems: "flex-start" as const };

const nodeRenderers: NodeRendererRegistry = {
  doc: (_node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <View key={ctx.getKey()}>{children}</View>
  ),

  text: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode =>
    renderTextWithMarks(node, ctx.getKey),

  emoji: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const emojiName = node.attrs?.name as string | undefined;
    const emojiText = getEmojiTextFromName(emojiName) || (emojiName ? `:${emojiName}:` : "");
    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    return (
      <Text key={ctx.getKey()} style={node.attrs?._isInsideTableCell === true ? pdfStyles.tableText : undefined}>
        {getDisplayText(emojiText, shouldInsertBreaks)}
      </Text>
    );
  },

  paragraph: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const textAlign = node.attrs?.textAlign as string | null;
    const background = node.attrs?.backgroundColor as string | undefined;
    const parentType = node.attrs?._parentType as string | undefined;
    const alignStyle = getTextAlignStyle(textAlign);
    const flexStyle = getFlexAlignStyle(textAlign);
    const compactTableBlockStyle = getCompactTableBlockStyle(parentType);
    const resolvedBgColor =
      background && background !== "default" ? resolveColorForPdf(background, "background") : null;
    const bgStyle = resolvedBgColor ? { backgroundColor: resolvedBgColor } : {};

    const isInsideCompactParent =
      parentType === "taskItem" || parentType === "listItem" || isTableCellParent(parentType);
    const constrainedTextStyle = isTableCellParent(parentType) ? pdfStyles.constrainedText : {};
    const tableTextStyle = isTableCellParent(parentType) ? pdfStyles.tableText : {};
    const wrapperStyle = isInsideCompactParent
      ? [pdfStyles.shrinkableContent, compactTableBlockStyle, flexStyle, bgStyle]
      : [pdfStyles.paragraphWrapper, flexStyle, bgStyle];

    return (
      <View key={ctx.getKey()} style={wrapperStyle}>
        <Text style={[pdfStyles.paragraph, tableTextStyle, constrainedTextStyle, alignStyle, bgStyle]}>{children}</Text>
      </View>
    );
  },

  heading: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const level = (node.attrs?.level as number) || 1;
    const styleKey = `heading${level}` as keyof typeof pdfStyles;
    const style = pdfStyles[styleKey] || pdfStyles.heading1;
    const textAlign = node.attrs?.textAlign as string | null;
    const parentType = node.attrs?._parentType as string | undefined;
    const previousSiblingType = node.attrs?._previousSiblingType as string | undefined;
    const alignStyle = getTextAlignStyle(textAlign);
    const flexStyle = getFlexAlignStyle(textAlign);
    const compactTableBlockStyle = getCompactTableBlockStyle(parentType);
    const compactHeadingSpacing =
      previousSiblingType === CORE_EXTENSIONS.HEADING
        ? level === 1
          ? { marginTop: 10, marginBottom: 5 }
          : level === 2
            ? { marginTop: 8, marginBottom: 4 }
            : { marginTop: 7, marginBottom: 4 }
        : {};

    return (
      <View key={ctx.getKey()} style={flexStyle}>
        <Text style={[style, compactHeadingSpacing, compactTableBlockStyle, alignStyle]}>{children}</Text>
      </View>
    );
  },

  blockquote: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const parentType = node.attrs?._parentType as string | undefined;

    return (
      <View key={ctx.getKey()} style={[pdfStyles.blockquote, getCompactTableBlockStyle(parentType)]} wrap={false}>
        {children}
      </View>
    );
  },

  codeBlock: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const codeContent = node.content?.map((c) => c.text || "").join("") || "";
    const lineCount = (codeContent.match(/\n/g) || []).length + 1;
    const shouldWrap = lineCount > 25;
    const parentType = node.attrs?._parentType as string | undefined;
    const highlightedCodeBlock = node.attrs?._highlightedCodeBlock as PDFHighlightedCodeBlock | undefined;

    return (
      <View key={ctx.getKey()} style={[pdfStyles.codeBlock, getCompactTableBlockStyle(parentType)]} wrap={shouldWrap}>
        {highlightedCodeBlock ? (
          renderHighlightedCodeBlock(codeContent, highlightedCodeBlock, ctx)
        ) : (
          <Text style={{ ...getFontStyle(codeContent), ...pdfStyles.codeBlockText }}>{codeContent}</Text>
        )}
      </View>
    );
  },

  bulletList: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const parentType = node.attrs?._parentType as string | undefined;
    const isNested = parentType === "listItem";
    const isInsideTableCell = isTableCellParent(parentType);
    const indentStyle = isNested ? { marginLeft: 14.4 } : {};
    const compactMarginStyle = isNested || isInsideTableCell ? { marginVertical: 0 } : {};
    return (
      <View key={ctx.getKey()} style={[pdfStyles.list, indentStyle, compactMarginStyle]}>
        {children}
      </View>
    );
  },

  orderedList: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const parentType = node.attrs?._parentType as string | undefined;
    const isNested = parentType === "listItem";
    const isInsideTableCell = isTableCellParent(parentType);
    const indentStyle = isNested ? { marginLeft: 14.4 } : {};
    const compactMarginStyle = isNested || isInsideTableCell ? { marginVertical: 0 } : {};
    return (
      <View key={ctx.getKey()} style={[pdfStyles.list, indentStyle, compactMarginStyle]}>
        {children}
      </View>
    );
  },

  listItem: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const isOrdered = node.attrs?._parentType === "orderedList";
    const index = (node.attrs?._listItemIndex as number) || 0;
    const hasNestedList = node.content?.some((child) => child.type === "bulletList" || child.type === "orderedList");
    const markdownTaskChecked =
      typeof node.attrs?._markdownTaskChecked === "boolean" ? node.attrs._markdownTaskChecked : null;

    const bullet = isOrdered ? getOrderedListMarker(index) : "•";

    const textAlign = node.attrs?._textAlign as string | null;
    const flexStyle = getFlexAlignStyle(textAlign);
    const nestedStyle = hasNestedList ? { marginBottom: 0 } : {};

    if (markdownTaskChecked !== null) {
      return (
        <View key={ctx.getKey()} style={[pdfStyles.taskItem, flexStyle, nestedStyle]} wrap={false}>
          <View
            style={
              markdownTaskChecked ? [pdfStyles.taskCheckbox, pdfStyles.taskCheckboxChecked] : pdfStyles.taskCheckbox
            }
          >
            {markdownTaskChecked && <CheckIcon size={5.5} color="#ffffff" />}
          </View>
          <View style={pdfStyles.listItemContent}>{children}</View>
        </View>
      );
    }

    return (
      <View key={ctx.getKey()} style={[pdfStyles.listItem, flexStyle, nestedStyle]} wrap={false}>
        <View style={pdfStyles.listItemBullet}>
          <Text style={pdfStyles.listItemMarker}>{bullet}</Text>
        </View>
        <View style={pdfStyles.listItemContent}>{children}</View>
      </View>
    );
  },

  taskList: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const parentType = node.attrs?._parentType as string | undefined;

    return (
      <View key={ctx.getKey()} style={[pdfStyles.taskList, getCompactTableBlockStyle(parentType)]}>
        {children}
      </View>
    );
  },

  taskItem: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const checked = node.attrs?.checked === true;
    return (
      <View key={ctx.getKey()} style={pdfStyles.taskItem} wrap={false}>
        <View style={checked ? [pdfStyles.taskCheckbox, pdfStyles.taskCheckboxChecked] : pdfStyles.taskCheckbox}>
          {checked && <CheckIcon size={5.5} color="#ffffff" />}
        </View>
        <View style={pdfStyles.listItemContent}>{children}</View>
      </View>
    );
  },

  table: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <View
      key={ctx.getKey()}
      style={[
        pdfStyles.table,
        typeof node.attrs?._tableWidthPercentage === "string"
          ? { width: node.attrs._tableWidthPercentage, maxWidth: node.attrs._tableWidthPercentage }
          : {},
      ]}
    >
      {children}
    </View>
  ),

  columnList: (_node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <View key={ctx.getKey()} style={pdfStyles.columnList}>
      {children}
    </View>
  ),

  column: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const rawWidth = node.attrs?.["data-width"];
    const columnWidth =
      typeof rawWidth === "number" ? rawWidth : typeof rawWidth === "string" ? Number.parseFloat(rawWidth) : 1;
    const resolvedColumnWidth = Number.isFinite(columnWidth) && columnWidth > 0 ? columnWidth : 1;

    return (
      <View
        key={ctx.getKey()}
        style={[pdfStyles.column, { flexBasis: 0, flexGrow: resolvedColumnWidth, flexShrink: 1 }]}
      >
        {children}
      </View>
    );
  },

  tableRow: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const isHeader = node.attrs?._isHeader === true;
    const colorStyle = getResolvedNodeColors(node);
    return (
      <View
        key={ctx.getKey()}
        style={[isHeader ? pdfStyles.tableHeaderRow : pdfStyles.tableRow, colorStyle]}
        wrap={false}
      >
        {children}
      </View>
    );
  },

  tableHeader: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const layoutStyle = getTableCellLayoutStyle(node);
    const colorStyle = getResolvedNodeColors(node);

    return (
      <View
        key={ctx.getKey()}
        style={[
          pdfStyles.tableCellBase,
          pdfStyles.tableHeaderCellExtra,
          layoutStyle,
          colorStyle,
          ...getTableCellExtraStyles(node),
        ]}
      >
        {children}
      </View>
    );
  },

  tableCell: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const layoutStyle = getTableCellLayoutStyle(node);
    const colorStyle = getResolvedNodeColors(node);

    return (
      <View
        key={ctx.getKey()}
        style={[pdfStyles.tableCellBase, layoutStyle, colorStyle, ...getTableCellExtraStyles(node)]}
      >
        {children}
      </View>
    );
  },

  horizontalRule: (_node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <View key={ctx.getKey()} style={pdfStyles.horizontalRule} />
  ),

  hardBreak: (_node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <Text key={ctx.getKey()}>{"\n"}</Text>
  ),

  image: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    if (ctx.metadata?.noAssets) {
      return <View key={ctx.getKey()} />;
    }

    const src = (node.attrs?.src as string) || "";
    const width = node.attrs?.width as number | undefined;
    const alignment = (node.attrs?.alignment as string) || "left";

    if (!src) {
      return <View key={ctx.getKey()} />;
    }

    const alignmentStyle = getImageAlignmentStyle(alignment);

    return (
      <View key={ctx.getKey()} style={[{ width: "100%" }, alignmentStyle]}>
        <Image
          src={src}
          style={[pdfStyles.image, width ? { width, maxHeight: 500 } : { maxWidth: 400, maxHeight: 500 }]}
        />
      </View>
    );
  },

  imageComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    if (ctx.metadata?.noAssets) {
      return <View key={ctx.getKey()} />;
    }

    const assetId = (node.attrs?.src as string) || "";
    const rawWidth = node.attrs?.width;
    const width = typeof rawWidth === "string" ? parseInt(rawWidth, 10) : (rawWidth as number | undefined);
    const alignment = (node.attrs?.alignment as string) || "left";

    if (!assetId) {
      return <View key={ctx.getKey()} />;
    }

    let resolvedSrc = assetId;
    if (ctx.metadata?.resolvedImageUrls && ctx.metadata.resolvedImageUrls[assetId]) {
      resolvedSrc = ctx.metadata.resolvedImageUrls[assetId];
    }

    const alignmentStyle = getImageAlignmentStyle(alignment);

    if (!resolvedSrc.startsWith("http") && !resolvedSrc.startsWith("data:")) {
      return (
        <View key={ctx.getKey()} style={[pdfStyles.imagePlaceholder, alignmentStyle]}>
          <Text style={pdfStyles.imagePlaceholderText}>[Image: {assetId.slice(0, 8)}...]</Text>
        </View>
      );
    }

    const imageStyle = width && !isNaN(width) ? { width, maxHeight: 500 } : { maxWidth: 400, maxHeight: 500 };

    return (
      <View key={ctx.getKey()} style={[{ width: "100%" }, alignmentStyle]}>
        <Image src={resolvedSrc} style={[pdfStyles.image, imageStyle]} />
      </View>
    );
  },

  calloutComponent: (node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const backgroundKey = (node.attrs?.["data-background"] as string) || "gray";
    const backgroundColor =
      EDITOR_BACKGROUND_COLORS[backgroundKey as keyof typeof EDITOR_BACKGROUND_COLORS] || BACKGROUND_COLORS.layer3;

    return (
      <View key={ctx.getKey()} style={[pdfStyles.callout, { backgroundColor }]}>
        <View style={pdfStyles.calloutIconContainer}>{getCalloutIcon(node, TEXT_COLORS.primary, ctx.metadata)}</View>
        <View style={[pdfStyles.calloutContent, { color: TEXT_COLORS.primary }]}>{children}</View>
      </View>
    );
  },

  mention: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const id = (node.attrs?.id as string) || "";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const entityName = (node.attrs?.entity_name as string) || "";
    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    let displayText = entityName || id || entityIdentifier;
    let workItemMention = null;

    if (ctx.metadata) {
      if (entityName === "user_mention" || entityName === "user") {
        const userMention = ctx.metadata.userMentions?.find((u) => u.id === entityIdentifier || u.id === id);
        if (userMention) {
          displayText = userMention.display_name;
        }
      } else if (entityName === "issue_mention") {
        workItemMention = ctx.metadata.workItemMentions?.find((w) => w.id === entityIdentifier || w.id === id);
        if (workItemMention) {
          displayText = `${workItemMention.project__identifier}-${workItemMention.sequence_id}`;
        }
      }
    }

    const mentionLabel = `@${getDisplayText(displayText, shouldInsertBreaks)}`;

    if (workItemMention && workItemMention.project_id) {
      const baseUrl = ctx.metadata?.baseUrl || "";
      const workspaceSlug = ctx.metadata?.workspaceSlug || "";
      const href = `${baseUrl}/${workspaceSlug}/projects/${workItemMention.project_id}/issues/${workItemMention.id}`;
      return (
        <Link key={ctx.getKey()} src={href} style={pdfStyles.mention}>
          {mentionLabel}
        </Link>
      );
    }

    const userMention = ctx.metadata?.userMentions?.find((u) => u.id === entityIdentifier || u.id === id);
    if (userMention) {
      const baseUrl = ctx.metadata?.baseUrl || "";
      const workspaceSlug = ctx.metadata?.workspaceSlug || "";
      const userHref = `${baseUrl}/${workspaceSlug}/profile/${userMention.id}`;
      return (
        <Link key={ctx.getKey()} src={userHref} style={pdfStyles.mention}>
          {mentionLabel}
        </Link>
      );
    }

    return (
      <Text key={ctx.getKey()} style={pdfStyles.mention}>
        {mentionLabel}
      </Text>
    );
  },

  "issue-embed-component": (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const projectIdentifier = (node.attrs?.project_identifier as string) || "";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const entityName = (node.attrs?.entity_name as string) || "";
    const entityId = (node.attrs?.id as string) || "";

    let displayText = "Work Item";
    let workItemName = "";
    let workItem = null;

    if (ctx.metadata?.workItemEmbeds) {
      workItem = ctx.metadata.workItemEmbeds.find((w) => w.id === entityId || w.id === entityIdentifier) || null;
      if (workItem) {
        displayText = `${workItem.project__identifier}-${workItem.sequence_id}`;
        workItemName = workItem.name;
      }
    }

    if (displayText === "Work Item" && projectIdentifier && entityIdentifier) {
      displayText = `${projectIdentifier}-${entityIdentifier}`;
    } else if (displayText === "Work Item" && entityName) {
      displayText = entityName;
    }

    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    const href = workItem ? `${baseUrl}/${workspaceSlug}/projects/${workItem.project_id}/issues/${workItem.id}` : null;

    return (
      <View key={ctx.getKey()} style={pdfStyles.workItemEmbed}>
        <View style={pdfStyles.workItemEmbedIcon}>
          <TaskIcon size={14} color="#374151" />
        </View>
        <View style={pdfStyles.workItemEmbedContent}>
          {href ? (
            <Link src={href} style={pdfStyles.workItemEmbedText}>
              {getDisplayText(displayText, shouldInsertBreaks)}
            </Link>
          ) : (
            <Text style={pdfStyles.workItemEmbedText}>{getDisplayText(displayText, shouldInsertBreaks)}</Text>
          )}
          {workItemName && (
            <Text style={pdfStyles.workItemEmbedSubtitle}>{getDisplayText(workItemName, shouldInsertBreaks)}</Text>
          )}
        </View>
      </View>
    );
  },

  pageEmbedComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const entityName = (node.attrs?.entity_name as string) || "sub_page";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";

    let displayText = entityIdentifier || entityName;
    let pageEmbed = null;

    if (ctx.metadata?.pageEmbeds) {
      pageEmbed = ctx.metadata.pageEmbeds.find((p) => p.id === entityIdentifier) || null;
      if (pageEmbed) {
        displayText = pageEmbed.name;
      }
    }

    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    let href: string | null = null;
    if (pageEmbed) {
      if (pageEmbed.project_id) {
        href = `${baseUrl}/${workspaceSlug}/projects/${pageEmbed.project_id}/pages/${pageEmbed.id}`;
      } else if (pageEmbed.teamspace_id) {
        href = `${baseUrl}/${workspaceSlug}/teamspaces/${pageEmbed.teamspace_id}/pages/${pageEmbed.id}`;
      } else {
        href = `${baseUrl}/${workspaceSlug}/wiki/${pageEmbed.id}`;
      }
    }

    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    return (
      <View key={ctx.getKey()} style={pdfStyles.pageEmbed}>
        <View style={pdfStyles.pageEmbedIconContainer}>
          <DocumentIcon size={12} color="#1e40af" />
        </View>
        <View style={pdfStyles.pageEmbedContent}>
          {href ? (
            <Link src={href} style={pdfStyles.pageEmbedText}>
              {getDisplayText(displayText, shouldInsertBreaks)}
            </Link>
          ) : (
            <Text style={pdfStyles.pageEmbedText}>{getDisplayText(displayText, shouldInsertBreaks)}</Text>
          )}
        </View>
      </View>
    );
  },

  pageLinkComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const entityName = (node.attrs?.entity_name as string) || "page_link";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const projectId = node.attrs?.project_id as string | undefined;

    const displayText = entityIdentifier || entityName;
    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    let href: string | null = null;
    if (entityIdentifier && workspaceSlug) {
      if (projectId) {
        href = `${baseUrl}/${workspaceSlug}/projects/${projectId}/pages/${entityIdentifier}`;
      } else {
        href = `${baseUrl}/${workspaceSlug}/wiki/${entityIdentifier}`;
      }
    }

    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    return (
      <View key={ctx.getKey()} style={pdfStyles.pageLink}>
        <View style={pdfStyles.pageLinkIconContainer}>
          <LinkIcon size={12} color="#2563eb" />
        </View>
        <View style={pdfStyles.pageLinkContent}>
          {href ? (
            <Link src={href} style={pdfStyles.pageLinkText}>
              {getDisplayText(displayText, shouldInsertBreaks)}
            </Link>
          ) : (
            <Text style={pdfStyles.pageLinkText}>{getDisplayText(displayText, shouldInsertBreaks)}</Text>
          )}
        </View>
      </View>
    );
  },

  attachmentComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const fileName = (node.attrs?.["data-name"] as string) || "Attachment";
    const fileType = (node.attrs?.["data-file-type"] as string) || "";
    const fileSize = node.attrs?.["data-file-size"] as number | string | null;
    const assetId = (node.attrs?.id as string) || "";

    const formatFileSize = (size: number | string | null): string => {
      if (!size) return "";
      const bytes = typeof size === "string" ? parseInt(size, 10) : size;
      if (isNaN(bytes)) return "";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const resolvedUrl = assetId && ctx.metadata?.resolvedImageUrls?.[assetId];
    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    const attachmentInner = (
      <View style={pdfStyles.attachment}>
        <View style={pdfStyles.attachmentIconContainer}>
          <FileIcon fileType={fileType} />
        </View>
        <View style={pdfStyles.attachmentInfo}>
          <Text style={pdfStyles.attachmentName}>{getDisplayText(fileName, shouldInsertBreaks)}</Text>
          {fileSize && <Text style={pdfStyles.attachmentSize}>{formatFileSize(fileSize)}</Text>}
        </View>
      </View>
    );

    // Wrap entire attachment block in Link if URL is available
    if (resolvedUrl) {
      return (
        <Link key={ctx.getKey()} src={resolvedUrl} style={{ textDecoration: "none" }}>
          {attachmentInner}
        </Link>
      );
    }

    return <View key={ctx.getKey()}>{attachmentInner}</View>;
  },

  externalEmbedComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const src = (node.attrs?.src as string) || "";
    const isRichCard = node.attrs?.["data-is-rich-card"] as boolean;
    const entityName = (node.attrs?.["data-entity-name"] as string) || "";
    const shouldInsertBreaks = node.attrs?._isInsideTableCell === true;

    return (
      <View key={ctx.getKey()} style={pdfStyles.externalEmbed}>
        <View style={pdfStyles.externalEmbedIconContainer}>
          {isRichCard ? <GlobeIcon size={12} color="#374151" /> : <LinkIcon size={12} color="#2563eb" />}
        </View>
        <View style={pdfStyles.externalEmbedContent}>
          {entityName && (
            <Text style={pdfStyles.externalEmbedTitle}>{getDisplayText(entityName, shouldInsertBreaks)}</Text>
          )}
          <Link src={src} style={pdfStyles.externalEmbedLink}>
            {getDisplayText(src, shouldInsertBreaks)}
          </Link>
        </View>
      </View>
    );
  },

  aiBlockComponent: (_node: TipTapNode, children: ReactNode[], ctx: PDFRenderContext): ReactNode => (
    <View key={ctx.getKey()} style={pdfStyles.aiBlock}>
      {children}
    </View>
  ),

  blockMath: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const latex = (node.attrs?.latex as string) || "";

    return (
      <View key={ctx.getKey()} style={pdfStyles.blockMath}>
        <Text style={pdfStyles.mathText}>{latex || "[Math equation]"}</Text>
      </View>
    );
  },

  inlineMath: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const latex = (node.attrs?.latex as string) || "";

    return (
      <Text key={ctx.getKey()} style={pdfStyles.inlineMath}>
        {latex || "[Math]"}
      </Text>
    );
  },

  drawIoComponent: (node: TipTapNode, _children: ReactNode[], ctx: PDFRenderContext): ReactNode => {
    const mode = (node.attrs?.["data-mode"] as EDrawioMode) || EDrawioMode.DIAGRAM;

    const renderDrawioPlaceholder = () => (
      <View key={ctx.getKey()} style={pdfStyles.drawioPlaceholder}>
        <View style={pdfStyles.drawioPlaceholderContent}>
          {mode === EDrawioMode.BOARD ? (
            <ClipboardIcon size={14} color="#6b7280" />
          ) : (
            <DiagramIcon size={14} color="#6b7280" />
          )}
          <Text style={pdfStyles.drawioPlaceholderText}>{mode === EDrawioMode.BOARD ? "Whiteboard" : "Diagram"}</Text>
        </View>
      </View>
    );

    if (ctx.metadata?.noAssets) {
      return renderDrawioPlaceholder();
    }

    const imageSrc = (node.attrs?.["data-image-src"] as string) || "";

    if (imageSrc) {
      return (
        <View key={ctx.getKey()} style={pdfStyles.drawio}>
          <Image src={imageSrc} style={pdfStyles.drawioImage} />
        </View>
      );
    }

    return renderDrawioPlaceholder();
  },
};

type InternalRenderContext = {
  parentType?: string;
  previousSiblingType?: string;
  nestingLevel: number;
  listItemIndex: number;
  tableColumnStartIndex: number;
  tableColumnWidths?: number[];
  textAlign?: string | null;
  isInsideTableCell: boolean;
  pdfContext: PDFRenderContext;
};

function renderSingleTableNodeWithContext(node: TipTapNode, context: InternalRenderContext): ReactNode {
  const tableColumnWidths = getTableColumnWidths(node);
  const totalColumns = tableColumnWidths.length;
  const tableWidthPercentage = getTableWidthPercentage(
    tableColumnWidths,
    context.pdfContext.metadata?.pageContentWidth
  );
  let activeRowSpans = new Map<number, ActiveRowSpanEntry>();
  let rowSpanSourceCounter = 0;

  const renderedRows = (node.content ?? []).map((row) => {
    const rowCells = row.content ?? [];
    const rowChildren: ReactNode[] = [];
    let rowCellIndex = 0;
    let columnIndex = 0;
    const nextActiveRowSpans = decrementActiveRowSpans(activeRowSpans);

    while (columnIndex < totalColumns) {
      const activeRowSpan = activeRowSpans.get(columnIndex);

      if (activeRowSpan) {
        let placeholderColspan = 1;

        while (columnIndex + placeholderColspan < totalColumns) {
          const nextActiveRowSpan = activeRowSpans.get(columnIndex + placeholderColspan);

          if (!nextActiveRowSpan || nextActiveRowSpan.sourceId !== activeRowSpan.sourceId) {
            break;
          }

          placeholderColspan += 1;
        }

        const placeholderNode: TipTapNode = {
          type: activeRowSpan.cellType,
          attrs: {
            colspan: placeholderColspan,
            _isRowSpanPlaceholder: true,
            _resolvedColorStyle: activeRowSpan.colorStyle,
            _rowspanContinues: activeRowSpan.remainingRows > 1,
          },
          content: [],
        };

        rowChildren.push(
          renderNodeWithContext(placeholderNode, {
            parentType: row.type,
            nestingLevel: context.nestingLevel,
            listItemIndex: 0,
            tableColumnStartIndex: columnIndex,
            tableColumnWidths,
            textAlign: context.textAlign,
            isInsideTableCell: true,
            pdfContext: context.pdfContext,
          })
        );

        columnIndex += placeholderColspan;
        continue;
      }

      const cell = rowCells[rowCellIndex];
      if (!cell) {
        break;
      }

      const colspan = getCellColspan(cell);
      const rowspan = typeof cell.attrs?.rowspan === "number" && cell.attrs.rowspan > 1 ? cell.attrs.rowspan : 1;
      const mergedColorStyle = mergeColorStyles(getResolvedNodeColors(row), getResolvedNodeColors(cell));
      const cellNode: TipTapNode = {
        ...cell,
        attrs: {
          ...cell.attrs,
          _resolvedColorStyle: mergedColorStyle,
          _rowspanContinues: rowspan > 1,
        },
      };

      rowChildren.push(
        renderNodeWithContext(cellNode, {
          parentType: row.type,
          nestingLevel: context.nestingLevel,
          listItemIndex: 0,
          tableColumnStartIndex: columnIndex,
          tableColumnWidths,
          textAlign: context.textAlign,
          isInsideTableCell: true,
          pdfContext: context.pdfContext,
        })
      );

      if (rowspan > 1) {
        const sourceId = `rowspan-${rowSpanSourceCounter++}`;

        for (let offset = 0; offset < colspan; offset++) {
          nextActiveRowSpans.set(columnIndex + offset, {
            sourceId,
            remainingRows: rowspan - 1,
            cellType: cell.type,
            colorStyle: mergedColorStyle,
          });
        }
      }

      columnIndex += colspan;
      rowCellIndex += 1;
    }

    activeRowSpans = nextActiveRowSpans;

    const rowNode: TipTapNode = {
      ...row,
      attrs: {
        ...row.attrs,
        _isHeader: isTableHeaderRow(row),
      },
    };

    return nodeRenderers.tableRow(rowNode, rowChildren, context.pdfContext);
  });

  return nodeRenderers.table(
    {
      ...node,
      attrs: {
        ...node.attrs,
        _tableWidthPercentage: tableWidthPercentage,
      },
    },
    renderedRows,
    context.pdfContext
  );
}

const renderNodeWithContext = (node: TipTapNode, context: InternalRenderContext): ReactNode => {
  const {
    parentType,
    previousSiblingType,
    nestingLevel,
    listItemIndex,
    tableColumnStartIndex,
    tableColumnWidths,
    textAlign,
    pdfContext,
  } = context;

  const nodeType = node.type as CORE_EXTENSIONS;
  if (nodeType === CORE_EXTENSIONS.TABLE) {
    return renderSingleTableNodeWithContext(node, context);
  }

  const markdownTaskChecked =
    nodeType === CORE_EXTENSIONS.LIST_ITEM && parentType === CORE_EXTENSIONS.BULLET_LIST
      ? getMarkdownTaskState(node)
      : null;
  const sourceNode = markdownTaskChecked === null ? node : stripMarkdownTaskPrefixFromListItem(node);

  const isListContainer = nodeType === CORE_EXTENSIONS.BULLET_LIST || nodeType === CORE_EXTENSIONS.ORDERED_LIST;
  const resolvedTableColumnWidths = tableColumnWidths;
  const isInsideTableCell =
    context.isInsideTableCell || isTableCellParent(parentType) || isTableCellParent(sourceNode.type);

  let childTextAlign = textAlign;
  if (nodeType === CORE_EXTENSIONS.PARAGRAPH && sourceNode.attrs?.textAlign) {
    childTextAlign = sourceNode.attrs.textAlign as string;
  }

  const nodeWithContext = {
    ...sourceNode,
    attrs: {
      ...sourceNode.attrs,
      _parentType: parentType,
      _previousSiblingType: previousSiblingType,
      _nestingLevel: nestingLevel,
      _listItemIndex: listItemIndex,
      _tableColumnStartIndex: tableColumnStartIndex,
      _tableColumnWidths: resolvedTableColumnWidths,
      _textAlign: childTextAlign,
      _isInsideTableCell: isInsideTableCell,
      _markdownTaskChecked: markdownTaskChecked,
      _isHeader: sourceNode.type === "tableRow" ? isTableHeaderRow(sourceNode) : false,
    },
  };

  let childNestingLevel = nestingLevel;
  if (isListContainer && parentType === CORE_EXTENSIONS.LIST_ITEM) {
    childNestingLevel = nestingLevel + 1;
  }

  let currentListItemIndex = 0;
  let currentTableColumnIndex = 0;
  let previousChildType: string | undefined;
  const children: ReactNode[] =
    sourceNode.content?.map((child) => {
      const childContext: InternalRenderContext = {
        parentType: sourceNode.type,
        previousSiblingType: previousChildType,
        nestingLevel: childNestingLevel,
        listItemIndex: 0,
        tableColumnStartIndex: 0,
        tableColumnWidths: resolvedTableColumnWidths,
        textAlign: childTextAlign,
        isInsideTableCell,
        pdfContext,
      };

      if (isListContainer && (child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.LIST_ITEM) {
        currentListItemIndex++;
        childContext.listItemIndex = currentListItemIndex;
      }

      if (
        nodeType === CORE_EXTENSIONS.TABLE_ROW &&
        ((child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.TABLE_CELL ||
          (child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.TABLE_HEADER)
      ) {
        childContext.tableColumnStartIndex = currentTableColumnIndex;
        currentTableColumnIndex += getCellColspan(child);
      }

      const renderedChild = renderNodeWithContext(child, childContext);
      previousChildType = child.type;
      return renderedChild;
    }) || [];

  const renderer = nodeRenderers[sourceNode.type];
  if (renderer) {
    return renderer(nodeWithContext, children, pdfContext);
  }

  if (children.length > 0) {
    return <View key={pdfContext.getKey()}>{children}</View>;
  }

  return <View key={pdfContext.getKey()} />;
};

export const renderNode = (
  node: TipTapNode,
  parentType?: string,
  _index?: number,
  metadata?: PDFExportMetadata,
  getKey?: KeyGenerator
): ReactNode => {
  const keyGen = getKey ?? createKeyGenerator();

  return renderNodeWithContext(node, {
    parentType,
    previousSiblingType: undefined,
    nestingLevel: 0,
    listItemIndex: 0,
    tableColumnStartIndex: 0,
    isInsideTableCell: false,
    pdfContext: { getKey: keyGen, metadata },
  });
};
