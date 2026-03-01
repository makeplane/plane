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
import type { ReactElement } from "react";
import { CORE_EXTENSIONS, EDrawioMode } from "@plane/editor";
import { BACKGROUND_COLORS, EDITOR_BACKGROUND_COLORS, resolveColorForPdf, TEXT_COLORS } from "./colors";
import {
  CheckIcon,
  ClipboardIcon,
  DiagramIcon,
  DocumentIcon,
  getFileIcon,
  GlobeIcon,
  LightbulbIcon,
  LinkIcon,
  TaskIcon,
} from "./icons";
import { applyMarks } from "./mark-renderers";
import { pdfStyles } from "./styles";
import type { KeyGenerator, NodeRendererRegistry, PDFExportMetadata, PDFRenderContext, TipTapNode } from "./types";

const getCalloutIcon = (node: TipTapNode, color: string): ReactElement => {
  const logoInUse = node.attrs?.["data-logo-in-use"] as string | undefined;
  const iconName = node.attrs?.["data-icon-name"] as string | undefined;
  const iconColor = (node.attrs?.["data-icon-color"] as string) || color;

  if (logoInUse === "emoji") {
    // react-pdf doesn't support emoji rendering (PDF fonts lack emoji glyphs)
    // Fall back to a generic icon instead
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

export const getFontStyle = (text: string | undefined): Record<string, string> => {
  if (!text) return {};
  return { fontFamily: "Noto Sans CJK" };
};

const renderTextWithMarks = (node: TipTapNode, getKey: KeyGenerator): ReactElement => {
  const style = applyMarks(node.marks, {});
  const fontStyle = getFontStyle(node.text);
  const hasLink = node.marks?.find((m) => m.type === "link");

  if (hasLink) {
    const href = (hasLink.attrs?.href as string) || "#";
    return (
      <Link key={getKey()} src={href} style={{ ...pdfStyles.link, ...style, ...fontStyle }}>
        {node.text || ""}
      </Link>
    );
  }

  return (
    <Text key={getKey()} style={{ ...style, ...fontStyle }}>
      {node.text || ""}
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

export const nodeRenderers: NodeRendererRegistry = {
  doc: (_node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <View key={ctx.getKey()}>{children}</View>
  ),

  text: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement =>
    renderTextWithMarks(node, ctx.getKey),

  paragraph: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const textAlign = node.attrs?.textAlign as string | null;
    const background = node.attrs?.backgroundColor as string | undefined;
    const parentType = node.attrs?._parentType as string | undefined;
    const alignStyle = getTextAlignStyle(textAlign);
    const flexStyle = getFlexAlignStyle(textAlign);
    const resolvedBgColor =
      background && background !== "default" ? resolveColorForPdf(background, "background") : null;
    const bgStyle = resolvedBgColor ? { backgroundColor: resolvedBgColor } : {};

    const isInsideListOrTask = parentType === "taskItem" || parentType === "listItem";
    const wrapperStyle = isInsideListOrTask ? [flexStyle, bgStyle] : [pdfStyles.paragraphWrapper, flexStyle, bgStyle];

    return (
      <View key={ctx.getKey()} style={wrapperStyle}>
        <Text style={[pdfStyles.paragraph, alignStyle, bgStyle]}>{children}</Text>
      </View>
    );
  },

  heading: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const level = (node.attrs?.level as number) || 1;
    const styleKey = `heading${level}` as keyof typeof pdfStyles;
    const style = pdfStyles[styleKey] || pdfStyles.heading1;
    const textAlign = node.attrs?.textAlign as string | null;
    const alignStyle = getTextAlignStyle(textAlign);
    const flexStyle = getFlexAlignStyle(textAlign);

    return (
      <View key={ctx.getKey()} style={flexStyle}>
        <Text style={[style, alignStyle]}>{children}</Text>
      </View>
    );
  },

  blockquote: (_node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <View key={ctx.getKey()} style={pdfStyles.blockquote} wrap={false}>
      {children}
    </View>
  ),

  codeBlock: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const codeContent = node.content?.map((c) => c.text || "").join("") || "";
    const lineCount = (codeContent.match(/\n/g) || []).length + 1;
    const shouldWrap = lineCount > 25;
    return (
      <View key={ctx.getKey()} style={pdfStyles.codeBlock} wrap={shouldWrap}>
        <Text style={{ ...pdfStyles.codeBlockText, ...getFontStyle(codeContent) }}>{codeContent}</Text>
      </View>
    );
  },

  bulletList: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const isNested = node.attrs?._parentType === "listItem";
    const indentStyle = isNested ? { marginLeft: 18 } : {};
    const nestedMarginStyle = isNested ? { marginVertical: 0 } : {};
    return (
      <View key={ctx.getKey()} style={[pdfStyles.bulletList, indentStyle, nestedMarginStyle]}>
        {children}
      </View>
    );
  },

  orderedList: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const isNested = node.attrs?._parentType === "listItem";
    const indentStyle = isNested ? { marginLeft: 18 } : {};
    const nestedMarginStyle = isNested ? { marginVertical: 0 } : {};
    return (
      <View key={ctx.getKey()} style={[pdfStyles.orderedList, indentStyle, nestedMarginStyle]}>
        {children}
      </View>
    );
  },

  listItem: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const isOrdered = node.attrs?._parentType === "orderedList";
    const index = (node.attrs?._listItemIndex as number) || 0;
    const hasNestedList = node.content?.some((child) => child.type === "bulletList" || child.type === "orderedList");

    const bullet = isOrdered ? `${index}.` : "•";

    const textAlign = node.attrs?._textAlign as string | null;
    const flexStyle = getFlexAlignStyle(textAlign);
    const nestedStyle = hasNestedList ? { marginBottom: 0 } : {};

    return (
      <View key={ctx.getKey()} style={[pdfStyles.listItem, flexStyle, nestedStyle]} wrap={false}>
        <View style={pdfStyles.listItemBullet}>
          <Text>{bullet}</Text>
        </View>
        <View style={pdfStyles.listItemContent}>{children}</View>
      </View>
    );
  },

  taskList: (_node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <View key={ctx.getKey()} style={pdfStyles.taskList}>
      {children}
    </View>
  ),

  taskItem: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const checked = node.attrs?.checked === true;
    return (
      <View key={ctx.getKey()} style={pdfStyles.taskItem} wrap={false}>
        <View style={checked ? [pdfStyles.taskCheckbox, pdfStyles.taskCheckboxChecked] : pdfStyles.taskCheckbox}>
          {checked && <CheckIcon size={7} color="#ffffff" />}
        </View>
        <View style={pdfStyles.listItemContent}>{children}</View>
      </View>
    );
  },

  table: (_node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <View key={ctx.getKey()} style={pdfStyles.table}>
      {children}
    </View>
  ),

  tableRow: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const isHeader = node.attrs?._isHeader === true;
    return (
      <View key={ctx.getKey()} style={isHeader ? pdfStyles.tableHeaderRow : pdfStyles.tableRow} wrap={false}>
        {children}
      </View>
    );
  },

  tableHeader: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const colwidth = node.attrs?.colwidth as number[] | undefined;
    const background = node.attrs?.background as string | undefined;
    const width = colwidth?.[0];
    const widthStyle = width ? { width, flex: undefined } : {};
    const resolvedBgColor = background ? resolveColorForPdf(background, "background") : null;
    const bgStyle = resolvedBgColor ? { backgroundColor: resolvedBgColor } : {};

    return (
      <View key={ctx.getKey()} style={[pdfStyles.tableHeaderCell, widthStyle, bgStyle]}>
        {children}
      </View>
    );
  },

  tableCell: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const colwidth = node.attrs?.colwidth as number[] | undefined;
    const background = node.attrs?.background as string | undefined;
    const width = colwidth?.[0];
    const widthStyle = width ? { width, flex: undefined } : {};
    const resolvedBgColor = background ? resolveColorForPdf(background, "background") : null;
    const bgStyle = resolvedBgColor ? { backgroundColor: resolvedBgColor } : {};

    return (
      <View key={ctx.getKey()} style={[pdfStyles.tableCell, widthStyle, bgStyle]}>
        {children}
      </View>
    );
  },

  horizontalRule: (_node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <View key={ctx.getKey()} style={pdfStyles.horizontalRule} />
  ),

  hardBreak: (_node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => (
    <Text key={ctx.getKey()}>{"\n"}</Text>
  ),

  image: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    if (ctx.metadata?.noAssets) {
      return <View key={ctx.getKey()} />;
    }

    const src = (node.attrs?.src as string) || "";
    const width = node.attrs?.width as number | undefined;
    const alignment = (node.attrs?.alignment as string) || "left";

    if (!src) {
      return <View key={ctx.getKey()} />;
    }

    const alignmentStyle =
      alignment === "center"
        ? { alignItems: "center" as const }
        : alignment === "right"
          ? { alignItems: "flex-end" as const }
          : { alignItems: "flex-start" as const };

    return (
      <View key={ctx.getKey()} style={[{ width: "100%" }, alignmentStyle]}>
        <Image
          src={src}
          style={[pdfStyles.image, width ? { width, maxHeight: 500 } : { maxWidth: 400, maxHeight: 500 }]}
        />
      </View>
    );
  },

  imageComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
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

    const alignmentStyle =
      alignment === "center"
        ? { alignItems: "center" as const }
        : alignment === "right"
          ? { alignItems: "flex-end" as const }
          : { alignItems: "flex-start" as const };

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

  calloutComponent: (node: TipTapNode, children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const backgroundKey = (node.attrs?.["data-background"] as string) || "gray";
    const backgroundColor =
      EDITOR_BACKGROUND_COLORS[backgroundKey as keyof typeof EDITOR_BACKGROUND_COLORS] || BACKGROUND_COLORS.layer3;

    return (
      <View key={ctx.getKey()} style={[pdfStyles.callout, { backgroundColor }]}>
        <View style={pdfStyles.calloutIconContainer}>{getCalloutIcon(node, TEXT_COLORS.primary)}</View>
        <View style={[pdfStyles.calloutContent, { color: TEXT_COLORS.primary }]}>{children}</View>
      </View>
    );
  },

  mention: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const id = (node.attrs?.id as string) || "";
    const entityIdentifier = (node.attrs?.entity_identifier as string) || "";
    const entityName = (node.attrs?.entity_name as string) || "";

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

    if (workItemMention && workItemMention.project_id) {
      const baseUrl = ctx.metadata?.baseUrl || "";
      const workspaceSlug = ctx.metadata?.workspaceSlug || "";
      const href = `${baseUrl}/${workspaceSlug}/projects/${workItemMention.project_id}/issues/${workItemMention.id}`;
      return (
        <Link key={ctx.getKey()} src={href} style={pdfStyles.mention}>
          @{displayText}
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
          @{displayText}
        </Link>
      );
    }

    return (
      <Text key={ctx.getKey()} style={pdfStyles.mention}>
        @{displayText}
      </Text>
    );
  },

  "issue-embed-component": (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
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

    return (
      <View key={ctx.getKey()} style={pdfStyles.workItemEmbed}>
        <View style={pdfStyles.workItemEmbedIcon}>
          <TaskIcon size={14} color="#374151" />
        </View>
        <View style={{ flex: 1 }}>
          {href ? (
            <Link src={href} style={pdfStyles.workItemEmbedText}>
              {displayText}
            </Link>
          ) : (
            <Text style={pdfStyles.workItemEmbedText}>{displayText}</Text>
          )}
          {workItemName && <Text style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>{workItemName}</Text>}
        </View>
      </View>
    );
  },

  pageEmbedComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
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

    return (
      <View key={ctx.getKey()} style={pdfStyles.pageEmbed}>
        <View style={pdfStyles.pageEmbedIconContainer}>
          <DocumentIcon size={12} color="#1e40af" />
        </View>
        {href ? (
          <Link src={href} style={pdfStyles.pageEmbedText}>
            {displayText}
          </Link>
        ) : (
          <Text style={pdfStyles.pageEmbedText}>{displayText}</Text>
        )}
      </View>
    );
  },

  pageLinkComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
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

    return (
      <View key={ctx.getKey()} style={pdfStyles.pageLink}>
        <View style={pdfStyles.pageLinkIconContainer}>
          <LinkIcon size={12} color="#2563eb" />
        </View>
        {href ? (
          <Link src={href} style={pdfStyles.pageLinkText}>
            {displayText}
          </Link>
        ) : (
          <Text style={pdfStyles.pageLinkText}>{displayText}</Text>
        )}
      </View>
    );
  },

  attachmentComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
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

    // Get resolved URL for the attachment
    const resolvedUrl = assetId && ctx.metadata?.resolvedImageUrls?.[assetId];

    const attachmentInner = (
      <View style={pdfStyles.attachment}>
        <View style={pdfStyles.attachmentIconContainer}>{getFileIcon(fileType)}</View>
        <View style={pdfStyles.attachmentInfo}>
          <Text style={pdfStyles.attachmentName}>{fileName}</Text>
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

  externalEmbedComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const src = (node.attrs?.src as string) || "";
    const isRichCard = node.attrs?.["data-is-rich-card"] as boolean;
    const entityName = (node.attrs?.["data-entity-name"] as string) || "";

    return (
      <View key={ctx.getKey()} style={pdfStyles.externalEmbed}>
        <View style={pdfStyles.externalEmbedIconContainer}>
          {isRichCard ? <GlobeIcon size={12} color="#374151" /> : <LinkIcon size={12} color="#2563eb" />}
        </View>
        <View style={pdfStyles.externalEmbedContent}>
          {entityName && <Text style={pdfStyles.externalEmbedTitle}>{entityName}</Text>}
          <Link src={src} style={pdfStyles.externalEmbedLink}>
            {src}
          </Link>
        </View>
      </View>
    );
  },

  blockMath: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const latex = (node.attrs?.latex as string) || "";

    return (
      <View key={ctx.getKey()} style={pdfStyles.blockMath}>
        <Text style={pdfStyles.mathText}>{latex || "[Math equation]"}</Text>
      </View>
    );
  },

  inlineMath: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const latex = (node.attrs?.latex as string) || "";

    return (
      <Text key={ctx.getKey()} style={pdfStyles.inlineMath}>
        {latex || "[Math]"}
      </Text>
    );
  },

  drawIoComponent: (node: TipTapNode, _children: ReactElement[], ctx: PDFRenderContext): ReactElement => {
    const mode = (node.attrs?.["data-mode"] as EDrawioMode) || EDrawioMode.DIAGRAM;

    if (ctx.metadata?.noAssets) {
      return (
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
    }

    const imageSrc = (node.attrs?.["data-image-src"] as string) || "";

    if (imageSrc) {
      return (
        <View key={ctx.getKey()} style={pdfStyles.drawio}>
          <Image src={imageSrc} style={pdfStyles.drawioImage} />
        </View>
      );
    }

    return (
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
  },
};

type InternalRenderContext = {
  parentType?: string;
  nestingLevel: number;
  listItemIndex: number;
  textAlign?: string | null;
  pdfContext: PDFRenderContext;
};

const renderNodeWithContext = (node: TipTapNode, context: InternalRenderContext): ReactElement => {
  const { parentType, nestingLevel, listItemIndex, textAlign, pdfContext } = context;

  const nodeType = node.type as CORE_EXTENSIONS;
  const isListContainer = nodeType === CORE_EXTENSIONS.BULLET_LIST || nodeType === CORE_EXTENSIONS.ORDERED_LIST;

  let childTextAlign = textAlign;
  if (nodeType === CORE_EXTENSIONS.PARAGRAPH && node.attrs?.textAlign) {
    childTextAlign = node.attrs.textAlign as string;
  }

  const nodeWithContext = {
    ...node,
    attrs: {
      ...node.attrs,
      _parentType: parentType,
      _nestingLevel: nestingLevel,
      _listItemIndex: listItemIndex,
      _textAlign: childTextAlign,
      _isHeader: node.content?.some((child) => (child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.TABLE_HEADER),
    },
  };

  let childNestingLevel = nestingLevel;
  if (isListContainer && parentType === CORE_EXTENSIONS.LIST_ITEM) {
    childNestingLevel = nestingLevel + 1;
  }

  let currentListItemIndex = 0;
  const children: ReactElement[] =
    node.content?.map((child) => {
      const childContext: InternalRenderContext = {
        parentType: node.type,
        nestingLevel: childNestingLevel,
        listItemIndex: 0,
        textAlign: childTextAlign,
        pdfContext,
      };

      if (isListContainer && (child.type as CORE_EXTENSIONS) === CORE_EXTENSIONS.LIST_ITEM) {
        currentListItemIndex++;
        childContext.listItemIndex = currentListItemIndex;
      }

      return renderNodeWithContext(child, childContext);
    }) || [];

  const renderer = nodeRenderers[node.type];
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
): ReactElement => {
  const keyGen = getKey ?? createKeyGenerator();

  return renderNodeWithContext(node, {
    parentType,
    nestingLevel: 0,
    listItemIndex: 0,
    pdfContext: { getKey: keyGen, metadata },
  });
};
