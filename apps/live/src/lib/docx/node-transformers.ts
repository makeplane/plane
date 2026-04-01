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

import {
  AlignmentType,
  BorderStyle,
  CheckBox,
  ExternalHyperlink,
  HeadingLevel,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { IRunPropertiesOptions, ParagraphChild } from "docx";
import type { NodeRendererRegistry, TipTapNode } from "@/lib/export-core";
import {
  resolveColorForDocx,
  hexToDocxColor,
  EDITOR_BACKGROUND_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
  BRAND_COLORS,
  TEXT_COLORS,
} from "@/lib/export-core/colors";
import { applyMarks } from "@/lib/export-core/marks";
import { docxMarkTransformers } from "./mark-transformers";
import { MONO_FONT } from "./styles";
import type { DocxBlockOutput, DocxRenderContext } from "./types";
import { createImageRun, getImageInfo } from "./utils/image";
import { latexToMath } from "./utils/math";
import { cellWidth, FULL_TABLE_WIDTH, pxToDxa } from "./utils/table";

type DocxNodeRendererRegistry = NodeRendererRegistry<DocxBlockOutput[number], DocxRenderContext>;

const HEADING_LEVEL_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
};

const NOOP_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const mapAlignment = (
  textAlign: string | null | undefined
): (typeof AlignmentType)[keyof typeof AlignmentType] | undefined => {
  if (!textAlign) return undefined;
  switch (textAlign) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
};

const buildRunProps = (node: TipTapNode): IRunPropertiesOptions => {
  return applyMarks(node.marks, {}, docxMarkTransformers);
};

const buildTextRun = (node: TipTapNode): ParagraphChild => {
  const runProps = buildRunProps(node);
  const linkMark = node.marks?.find((m) => m.type === "link");

  if (linkMark) {
    const href = (linkMark.attrs?.href as string) || "#";
    return new ExternalHyperlink({
      children: [new TextRun({ ...runProps, text: node.text || "" })],
      link: href,
    });
  }

  return new TextRun({ ...runProps, text: node.text || "" });
};

const renderMentionInline = (node: TipTapNode, ctx: DocxRenderContext): ParagraphChild[] => {
  const id = (node.attrs?.id as string) || "";
  const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
  const entityName = (node.attrs?.entity_name as string) || "";

  let displayText = entityName || id || entityIdentifier;
  let href: string | null = null;

  if (ctx.metadata) {
    const baseUrl = ctx.metadata.baseUrl || "";
    const workspaceSlug = ctx.metadata.workspaceSlug || "";

    if (entityName === "user_mention" || entityName === "user") {
      const userMention = ctx.metadata.userMentions?.find((u) => u.id === entityIdentifier || u.id === id);
      if (userMention) {
        displayText = userMention.display_name;
        href = `${baseUrl}/${workspaceSlug}/profile/${userMention.id}`;
      }
    } else if (entityName === "issue_mention") {
      const workItemMention = ctx.metadata.workItemMentions?.find((w) => w.id === entityIdentifier || w.id === id);
      if (workItemMention) {
        displayText = `${workItemMention.project__identifier}-${workItemMention.sequence_id}`;
        href = `${baseUrl}/${workspaceSlug}/projects/${workItemMention.project_id}/issues/${workItemMention.id}`;
      }
    }
  }

  const runProps: IRunPropertiesOptions = {
    color: hexToDocxColor(BRAND_COLORS.default),
  };

  if (href) {
    return [
      new ExternalHyperlink({
        children: [new TextRun({ ...runProps, text: `@${displayText}` })],
        link: href,
      }),
    ];
  }

  return [new TextRun({ ...runProps, text: `@${displayText}` })];
};

const renderInlineContent = (nodes: TipTapNode[] | undefined, ctx: DocxRenderContext): ParagraphChild[] => {
  const out: ParagraphChild[] = [];
  for (const n of nodes ?? []) {
    switch (n.type) {
      case "text":
        out.push(buildTextRun(n));
        break;

      case "hardBreak":
        out.push(new TextRun({ break: 1 }));
        break;

      case "emoji": {
        const name = (n.attrs?.name as string) || "";
        const emojiChar = EMOJI_MAP[name] || `:${name}:`;
        out.push(new TextRun({ text: emojiChar }));
        break;
      }

      case "inlineMath": {
        const latex = (n.attrs?.latex as string) || "";
        const mathObj = latexToMath(latex);
        if (mathObj) {
          out.push(mathObj);
        } else {
          out.push(new TextRun({ text: latex || "[Math]", font: { name: MONO_FONT }, size: 20, color: "7C3AED" }));
        }
        break;
      }

      case "mention":
        out.push(...renderMentionInline(n, ctx));
        break;

      default:
        if (n.text) out.push(buildTextRun(n));
        break;
    }
  }
  return out;
};

const renderImageFromBase64 = (base64DataUrl: string, node: TipTapNode): (Paragraph | Table)[] | null => {
  const base64Data = base64DataUrl.split(",")[1];
  if (!base64Data) return null;
  const buffer = Buffer.from(base64Data, "base64");
  const info = getImageInfo(buffer);
  if (!info) return null;
  const rawWidth = node.attrs?.width;
  const customWidth = typeof rawWidth === "string" ? parseInt(rawWidth, 10) : (rawWidth as number | undefined);
  const alignment = (node.attrs?.alignment as string) || "left";
  const imageRun = createImageRun(buffer, info.width, info.height, customWidth, info.type);
  return [
    new Paragraph({
      children: [imageRun],
      alignment: mapAlignment(alignment),
      spacing: { before: 160, after: 160 },
    }),
  ];
};

const EMOJI_MAP: Record<string, string> = {
  "+1": "👍",
  "-1": "👎",
  smile: "😄",
  laughing: "😆",
  heart: "❤️",
  fire: "🔥",
  eyes: "👀",
  rocket: "🚀",
  star: "⭐",
  check: "✅",
  x: "❌",
  warning: "⚠️",
  bulb: "💡",
  thumbsup: "👍",
  thumbsdown: "👎",
  clap: "👏",
  wave: "👋",
  thinking: "🤔",
  tada: "🎉",
  sparkles: "✨",
  "100": "💯",
  pray: "🙏",
  muscle: "💪",
};

export const docxNodeTransformers: DocxNodeRendererRegistry = {
  doc: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => children,

  text: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => [
    new Paragraph({ children: [buildTextRun(node)] }),
  ],

  paragraph: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const textAlign = (node.attrs?.textAlign as string) || (node.attrs?._textAlign as string) || null;
    const background = node.attrs?.backgroundColor as string | undefined;
    const alignment = mapAlignment(textAlign);

    const resolvedBg =
      background && background !== "default" ? resolveColorForDocx(background, "background") : undefined;

    const inlineChildren = renderInlineContent(node.content, ctx);
    if (inlineChildren.length === 0) {
      inlineChildren.push(new TextRun({ text: "" }));
    }

    return [
      new Paragraph({
        children: inlineChildren,
        alignment,
        spacing: { after: 160 },
        ...(resolvedBg ? { shading: { type: ShadingType.CLEAR, fill: resolvedBg } } : {}),
      }),
    ];
  },

  heading: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const level = (node.attrs?.level as number) || 1;
    const clampedLevel = Math.min(Math.max(level, 1), 6);
    const textAlign = (node.attrs?.textAlign as string) || null;
    const alignment = mapAlignment(textAlign);
    const inlineChildren = renderInlineContent(node.content, ctx);

    return [
      new Paragraph({
        children: inlineChildren,
        heading: HEADING_LEVEL_MAP[clampedLevel],
        alignment,
      }),
    ];
  },

  blockquote: (node: TipTapNode, children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const contentNodes = node.content ?? [];
    const paragraphNodeCount = contentNodes.filter((c) => c.type === "paragraph").length;

    const result: DocxBlockOutput = [];

    // Re-render paragraph TipTap nodes with BlockQuote style
    for (const cNode of contentNodes) {
      if (cNode.type === "paragraph") {
        const inlineChildren = renderInlineContent(cNode.content, ctx);
        result.push(
          new Paragraph({
            children: inlineChildren.length > 0 ? inlineChildren : [new TextRun({ text: "" })],
            style: "BlockQuote",
          })
        );
      }
    }

    // Skip walker-rendered Paragraphs that correspond to the paragraph TipTap nodes
    // we just re-rendered above, then include all remaining walker children
    let skipped = 0;
    for (const child of children) {
      if (skipped < paragraphNodeCount && child instanceof Paragraph) {
        skipped++;
        continue;
      }
      result.push(child);
    }

    if (result.length === 0) {
      result.push(new Paragraph({ children: [new TextRun({ text: "" })], style: "BlockQuote" }));
    }
    return result;
  },

  codeBlock: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const codeContent = node.content?.map((c) => c.text || "").join("") || "";
    const lines = codeContent.split("\n");

    return lines.map(
      (line, i) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line || " ",
              font: { name: MONO_FONT },
              size: 19,
            }),
          ],
          style: "SourceCode",
          spacing: i === 0 ? { before: 160 } : i === lines.length - 1 ? { after: 160 } : {},
        })
    );
  },

  bulletList: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => children,

  orderedList: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => children,

  listItem: (node: TipTapNode, children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const isOrdered = node.attrs?._parentType === "orderedList";
    const nestingLevel = (node.attrs?._nestingLevel as number) || 0;

    const firstParagraphNode = (node.content ?? []).find((c) => c.type === "paragraph");
    const result: DocxBlockOutput = [];

    if (firstParagraphNode) {
      const inlineChildren = renderInlineContent(firstParagraphNode.content, ctx);
      result.push(
        new Paragraph({
          children: inlineChildren.length > 0 ? inlineChildren : [new TextRun({ text: "" })],
          numbering: {
            reference: isOrdered ? "plane-numbered-list" : "plane-bullet-list",
            level: nestingLevel,
          },
        })
      );
      // Add remaining walker children (skip the first Paragraph which we replaced)
      let skippedFirst = false;
      for (const child of children) {
        if (!skippedFirst && child instanceof Paragraph) {
          skippedFirst = true;
          continue;
        }
        result.push(child);
      }
    } else {
      result.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          numbering: {
            reference: isOrdered ? "plane-numbered-list" : "plane-bullet-list",
            level: nestingLevel,
          },
        })
      );
      result.push(...children);
    }

    return result;
  },

  taskList: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => children,

  taskItem: (node: TipTapNode, children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const checked = node.attrs?.checked === true;
    const nestingLevel = (node.attrs?._nestingLevel as number) || 0;
    const indent = nestingLevel > 0 ? { left: convertInchesToTwip(0.5 * nestingLevel) } : undefined;
    const checkbox = new CheckBox({
      checked,
      checkedState: { value: "2611", font: "MS Gothic" },
      uncheckedState: { value: "2610", font: "MS Gothic" },
    });

    const firstParagraphNode = (node.content ?? []).find((c) => c.type === "paragraph");
    const result: DocxBlockOutput = [];

    if (firstParagraphNode) {
      const contentNodes = checked
        ? (firstParagraphNode.content ?? []).map((n) => ({
            ...n,
            marks: [...(n.marks ?? []), { type: "strike" }],
          }))
        : firstParagraphNode.content;
      const inlineChildren = renderInlineContent(contentNodes, ctx);
      result.push(
        new Paragraph({
          children: [checkbox, new TextRun({ text: " " }), ...inlineChildren],
          spacing: { after: 40 },
          ...(indent ? { indent } : {}),
        })
      );
      // Add remaining walker children (skip the first Paragraph)
      let skippedFirst = false;
      for (const child of children) {
        if (!skippedFirst && child instanceof Paragraph) {
          skippedFirst = true;
          continue;
        }
        result.push(child);
      }
    } else {
      result.push(
        new Paragraph({
          children: [checkbox],
          spacing: { after: 40 },
          ...(indent ? { indent } : {}),
        })
      );
      result.push(...children);
    }

    return result;
  },

  table: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const rows = children.filter((c) => c instanceof TableRow) as TableRow[];
    if (rows.length === 0) return [];

    return [
      new Table({
        rows,
        width: FULL_TABLE_WIDTH,
      }),
    ];
  },

  tableRow: (node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const cells = children.filter((c) => c instanceof TableCell) as TableCell[];
    if (cells.length === 0) return [];

    const isHeader = node.attrs?._isHeader === true;

    return [
      new TableRow({
        children: cells,
        tableHeader: isHeader,
      }),
    ] as unknown as DocxBlockOutput;
  },

  tableHeader: (node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const colwidth = node.attrs?.colwidth as number[] | undefined;
    const background = node.attrs?.background as string | undefined;
    const colspan = (node.attrs?.colspan as number) || 1;
    const rowspan = (node.attrs?.rowspan as number) || 1;
    const width = colwidth?.[0];
    const resolvedBg = background
      ? resolveColorForDocx(background, "background")
      : hexToDocxColor(BACKGROUND_COLORS.surface2);

    const cellChildren = children.filter((c) => c instanceof Paragraph || c instanceof Table) as (Paragraph | Table)[];
    if (cellChildren.length === 0) {
      cellChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    return [
      new TableCell({
        children: cellChildren,
        width: width ? cellWidth(width) : undefined,
        shading: resolvedBg ? { type: ShadingType.CLEAR, fill: resolvedBg } : undefined,
        ...(colspan > 1 ? { columnSpan: colspan } : {}),
        ...(rowspan > 1 ? { rowSpan: rowspan } : {}),
      }),
    ] as unknown as DocxBlockOutput;
  },

  tableCell: (node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const colwidth = node.attrs?.colwidth as number[] | undefined;
    const background = node.attrs?.background as string | undefined;
    const colspan = (node.attrs?.colspan as number) || 1;
    const rowspan = (node.attrs?.rowspan as number) || 1;
    const width = colwidth?.[0];
    const resolvedBg = background ? resolveColorForDocx(background, "background") : undefined;

    const cellChildren = children.filter((c) => c instanceof Paragraph || c instanceof Table) as (Paragraph | Table)[];
    if (cellChildren.length === 0) {
      cellChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    return [
      new TableCell({
        children: cellChildren,
        width: width ? cellWidth(width) : undefined,
        shading: resolvedBg ? { type: ShadingType.CLEAR, fill: resolvedBg } : undefined,
        ...(colspan > 1 ? { columnSpan: colspan } : {}),
        ...(rowspan > 1 ? { rowSpan: rowspan } : {}),
      }),
    ] as unknown as DocxBlockOutput;
  },

  horizontalRule: (_node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => [
    new Paragraph({
      children: [],
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: hexToDocxColor(BORDER_COLORS.subtle1),
        },
      },
      spacing: { before: 320, after: 320 },
    }),
  ],

  hardBreak: (_node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => [
    new Paragraph({ children: [new TextRun({ break: 1 })] }),
  ],

  image: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    if (ctx.metadata?.noAssets) return [];

    const src = (node.attrs?.src as string) || "";
    if (!src) return [];

    if (src.startsWith("data:")) {
      const result = renderImageFromBase64(src, node);
      if (result) return result;
    }

    const resolvedSrc = ctx.metadata?.resolvedImageUrls?.[src];
    if (resolvedSrc?.startsWith("data:")) {
      const result = renderImageFromBase64(resolvedSrc, node);
      if (result) return result;
    }

    return [
      new Paragraph({
        children: [new TextRun({ text: `[Image: ${src.slice(0, 50)}]`, italics: true, color: "6B7280" })],
        spacing: { before: 160, after: 160 },
      }),
    ];
  },

  imageComponent: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    if (ctx.metadata?.noAssets) return [];

    const assetId = (node.attrs?.src as string) || "";
    if (!assetId) return [];

    const resolvedSrc = ctx.metadata?.resolvedImageUrls?.[assetId];
    if (resolvedSrc?.startsWith("data:")) {
      const result = renderImageFromBase64(resolvedSrc, node);
      if (result) return result;
    }

    return [
      new Paragraph({
        children: [new TextRun({ text: `[Image: ${assetId.slice(0, 8)}...]`, italics: true, color: "6B7280" })],
        spacing: { before: 160, after: 160 },
      }),
    ];
  },

  calloutComponent: (node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const backgroundKey = (node.attrs?.["data-background"] as string) || "gray";
    const bgColor =
      EDITOR_BACKGROUND_COLORS[backgroundKey as keyof typeof EDITOR_BACKGROUND_COLORS] || BACKGROUND_COLORS.layer3;
    const bgHex = hexToDocxColor(bgColor);

    const iconText = (node.attrs?.icon as string) || (node.attrs?.emoji as string) || "💡";

    const paragraphs = children.filter((c) => c instanceof Paragraph) as Paragraph[];
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    return [
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: iconText })] })],
                width: { size: pxToDxa(40), type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: bgHex },
                borders: NOOP_BORDERS,
              }),
              new TableCell({
                children: paragraphs,
                shading: { type: ShadingType.CLEAR, fill: bgHex },
                borders: NOOP_BORDERS,
              }),
            ],
          }),
        ],
        width: FULL_TABLE_WIDTH,
        borders: NOOP_BORDERS,
      }),
    ];
  },

  mention: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const id = (node.attrs?.id as string) || "";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const entityName = (node.attrs?.entity_name as string) || "";

    let displayText = entityName || id || entityIdentifier;
    let href: string | null = null;

    if (ctx.metadata) {
      const baseUrl = ctx.metadata.baseUrl || "";
      const workspaceSlug = ctx.metadata.workspaceSlug || "";

      if (entityName === "user_mention" || entityName === "user") {
        const userMention = ctx.metadata.userMentions?.find((u) => u.id === entityIdentifier || u.id === id);
        if (userMention) {
          displayText = userMention.display_name;
          href = `${baseUrl}/${workspaceSlug}/profile/${userMention.id}`;
        }
      } else if (entityName === "issue_mention") {
        const workItemMention = ctx.metadata.workItemMentions?.find((w) => w.id === entityIdentifier || w.id === id);
        if (workItemMention) {
          displayText = `${workItemMention.project__identifier}-${workItemMention.sequence_id}`;
          href = `${baseUrl}/${workspaceSlug}/projects/${workItemMention.project_id}/issues/${workItemMention.id}`;
        }
      }
    }

    const runProps: IRunPropertiesOptions = {
      color: hexToDocxColor(BRAND_COLORS.default),
    };

    if (href) {
      return [
        new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({ ...runProps, text: `@${displayText}` })],
              link: href,
            }),
          ],
        }),
      ];
    }

    return [new Paragraph({ children: [new TextRun({ ...runProps, text: `@${displayText}` })] })];
  },

  "issue-embed-component": (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
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

    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    const href = workItem ? `${baseUrl}/${workspaceSlug}/projects/${workItem.project_id}/issues/${workItem.id}` : null;

    const children: ParagraphChild[] = [];
    if (href) {
      children.push(
        new ExternalHyperlink({
          children: [new TextRun({ text: displayText, bold: true, color: hexToDocxColor(TEXT_COLORS.secondary) })],
          link: href,
        })
      );
    } else {
      children.push(new TextRun({ text: displayText, bold: true, color: hexToDocxColor(TEXT_COLORS.secondary) }));
    }

    if (workItemName) {
      children.push(new TextRun({ text: `  ${workItemName}`, size: 18, color: "6B7280" }));
    }

    return [new Paragraph({ children, spacing: { before: 80, after: 80 } })];
  },

  pageEmbedComponent: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    let displayText = entityIdentifier;
    let pageEmbed = null;

    if (ctx.metadata?.pageEmbeds) {
      pageEmbed = ctx.metadata.pageEmbeds.find((p) => p.id === entityIdentifier) || null;
      if (pageEmbed) {
        displayText = pageEmbed.name;
      }
    }

    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    const href = pageEmbed?.project_id
      ? `${baseUrl}/${workspaceSlug}/projects/${pageEmbed.project_id}/pages/${pageEmbed.id}`
      : null;

    if (href) {
      return [
        new Paragraph({
          children: [
            new TextRun({ text: "📄 " }),
            new ExternalHyperlink({
              children: [new TextRun({ text: displayText, bold: true, color: hexToDocxColor(BRAND_COLORS[900]) })],
              link: href,
            }),
          ],
          spacing: { before: 80, after: 80 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: hexToDocxColor(BRAND_COLORS.default),
              space: 6,
            },
          },
        }),
      ];
    }

    return [
      new Paragraph({
        children: [
          new TextRun({ text: "📄 " }),
          new TextRun({ text: displayText, bold: true, color: hexToDocxColor(BRAND_COLORS[900]) }),
        ],
        spacing: { before: 80, after: 80 },
      }),
    ];
  },

  pageLinkComponent: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const entityName = (node.attrs?.entity_name as string) || "page_link";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const projectId = node.attrs?.project_id as string | undefined;

    const displayText = entityIdentifier || entityName;
    const baseUrl = ctx.metadata?.baseUrl || "";
    const workspaceSlug = ctx.metadata?.workspaceSlug || "";
    const href =
      projectId && entityIdentifier
        ? `${baseUrl}/${workspaceSlug}/projects/${projectId}/pages/${entityIdentifier}`
        : null;

    if (href) {
      return [
        new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: displayText,
                  color: hexToDocxColor(BRAND_COLORS.default),
                  underline: { type: "single" },
                }),
              ],
              link: href,
            }),
          ],
        }),
      ];
    }

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: displayText,
            color: hexToDocxColor(BRAND_COLORS.default),
            underline: { type: "single" },
          }),
        ],
      }),
    ];
  },

  attachmentComponent: (node: TipTapNode, _children: DocxBlockOutput, ctx: DocxRenderContext): DocxBlockOutput => {
    const fileName = (node.attrs?.["data-name"] as string) || "Attachment";
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
    const sizeText = formatFileSize(fileSize);
    const label = sizeText ? `📎 ${fileName} (${sizeText})` : `📎 ${fileName}`;

    if (resolvedUrl) {
      return [
        new Paragraph({
          children: [
            new ExternalHyperlink({
              children: [new TextRun({ text: label, color: hexToDocxColor(BRAND_COLORS.default) })],
              link: resolvedUrl,
            }),
          ],
          spacing: { before: 80, after: 80 },
        }),
      ];
    }

    return [
      new Paragraph({
        children: [new TextRun({ text: label, color: hexToDocxColor(TEXT_COLORS.secondary) })],
        spacing: { before: 80, after: 80 },
      }),
    ];
  },

  externalEmbedComponent: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const src = (node.attrs?.src as string) || "";
    const entityName = (node.attrs?.["data-entity-name"] as string) || "";

    const children: ParagraphChild[] = [];
    if (entityName) {
      children.push(
        new TextRun({ text: `${entityName} — `, bold: true, color: hexToDocxColor(TEXT_COLORS.secondary) })
      );
    }
    children.push(
      new ExternalHyperlink({
        children: [
          new TextRun({ text: src, color: hexToDocxColor(BRAND_COLORS.default), underline: { type: "single" } }),
        ],
        link: src,
      })
    );

    return [new Paragraph({ children, spacing: { before: 80, after: 80 } })];
  },

  blockMath: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const latex = (node.attrs?.latex as string) || "";
    const mathObj = latexToMath(latex);

    if (mathObj) {
      return [
        new Paragraph({
          children: [mathObj],
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 160 },
        }),
      ];
    }

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: latex || "[Math equation]",
            font: { name: MONO_FONT },
            size: 22,
            color: hexToDocxColor(TEXT_COLORS.secondary),
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 160 },
      }),
    ];
  },

  inlineMath: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const latex = (node.attrs?.latex as string) || "";
    const mathObj = latexToMath(latex);

    if (mathObj) {
      return [
        new Paragraph({
          children: [mathObj],
        }),
      ];
    }

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: latex || "[Math]",
            font: { name: MONO_FONT },
            size: 20,
            color: "7C3AED",
          }),
        ],
      }),
    ];
  },

  drawIoComponent: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const mode = (node.attrs?.["data-mode"] as string) || "diagram";
    const label = mode === "board" ? "Whiteboard" : "Diagram";

    return [
      new Paragraph({
        children: [new TextRun({ text: `[${label}]`, italics: true, color: "6B7280" })],
        spacing: { before: 160, after: 160 },
      }),
    ];
  },

  emoji: (node: TipTapNode, _children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const name = (node.attrs?.name as string) || "";
    const emojiChar = EMOJI_MAP[name] || `:${name}:`;
    return [new Paragraph({ children: [new TextRun({ text: emojiChar })] })];
  },

  aiBlockComponent: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput =>
    children,

  multiColumn: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => children,

  column: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const cellChildren = children.filter((c) => c instanceof Paragraph || c instanceof Table) as (Paragraph | Table)[];
    if (cellChildren.length === 0) {
      cellChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    return [
      new TableCell({
        children: cellChildren,
        borders: NOOP_BORDERS,
        margins: { left: convertInchesToTwip(0.05), right: convertInchesToTwip(0.05) },
      }),
    ] as unknown as DocxBlockOutput;
  },

  columnList: (_node: TipTapNode, children: DocxBlockOutput, _ctx: DocxRenderContext): DocxBlockOutput => {
    const cells = children.filter((c) => c instanceof TableCell) as TableCell[];
    if (cells.length === 0) return children;

    const totalDxa = convertInchesToTwip(6.5);
    const perColumnDxa = Math.floor(totalDxa / cells.length);
    const columnWidths = cells.map((_, i) =>
      i === cells.length - 1 ? totalDxa - perColumnDxa * (cells.length - 1) : perColumnDxa
    );

    return [
      new Table({
        rows: [new TableRow({ children: cells })],
        width: FULL_TABLE_WIDTH,
        layout: TableLayoutType.FIXED,
        columnWidths,
        borders: NOOP_BORDERS,
      }),
    ];
  },
};
