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

import { StyleSheet } from "@react-pdf/renderer";
import {
  BACKGROUND_COLORS,
  BORDER_COLORS,
  BRAND_COLORS,
  CODE_COLORS,
  LINK_COLORS,
  MENTION_COLORS,
  NEUTRAL_COLORS,
  TEXT_COLORS,
} from "./colors";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Noto Sans CJK",
    fontSize: 11,
    lineHeight: 1.6,
    color: TEXT_COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 20,
    color: TEXT_COLORS.primary,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 600,
    marginTop: 16,
    marginBottom: 8,
    color: TEXT_COLORS.primary,
  },
  heading2: {
    fontSize: 16,
    fontWeight: 600,
    marginTop: 14,
    marginBottom: 6,
    color: TEXT_COLORS.primary,
  },
  heading3: {
    fontSize: 14,
    fontWeight: 600,
    marginTop: 12,
    marginBottom: 4,
    color: TEXT_COLORS.primary,
  },
  heading4: {
    fontSize: 12,
    fontWeight: 600,
    marginTop: 10,
    marginBottom: 4,
    color: TEXT_COLORS.secondary,
  },
  heading5: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 8,
    marginBottom: 4,
    color: TEXT_COLORS.secondary,
  },
  heading6: {
    fontSize: 10,
    fontWeight: 600,
    marginTop: 6,
    marginBottom: 4,
    color: TEXT_COLORS.tertiary,
  },
  paragraph: {
    marginBottom: 0,
  },
  paragraphWrapper: {
    marginBottom: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: BORDER_COLORS.strong, // Matches .ProseMirror blockquote border-strong
    paddingLeft: 12,
    marginLeft: 0,
    marginVertical: 8,
    fontStyle: "normal", // Matches editor: font-style: normal
    fontWeight: 400, // Matches editor: font-weight: 400
    color: TEXT_COLORS.primary,
    breakInside: "avoid",
  },
  codeBlock: {
    backgroundColor: NEUTRAL_COLORS[300],
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
  },
  codeBlockText: {
    fontFamily: "Courier",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: TEXT_COLORS.primary,
  },
  codeInline: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    fontFamily: "Courier",
    fontSize: 10,
    color: CODE_COLORS.text, // Red for inline code
  },
  bulletList: {
    marginVertical: 8,
    paddingLeft: 0,
  },
  orderedList: {
    marginVertical: 8,
    paddingLeft: 0,
  },
  listItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 10,
  },
  listItemBullet: {
    marginRight: 6,
  },
  listItemContent: {
    flex: 1,
  },
  taskList: {
    marginVertical: 8,
  },
  taskItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
    paddingRight: 10,
  },
  taskCheckbox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: BORDER_COLORS.strong,
    borderRadius: 2,
    marginTop: 3,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxChecked: {
    backgroundColor: BRAND_COLORS.default,
    borderColor: BRAND_COLORS.default,
  },
  table: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle1, // border-subtle-1
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLORS.subtle1,
    breakInside: "avoid",
  },
  tableHeaderRow: {
    backgroundColor: BACKGROUND_COLORS.surface2, // Slightly different from white
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLORS.subtle1,
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLORS.subtle1,
    flex: 1,
  },
  tableHeaderCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLORS.subtle1,
    flex: 1,
    fontWeight: "bold",
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLORS.subtle1, // Matches div[data-type="horizontalRule"] border-subtle-1
    marginVertical: 16,
  },
  image: {
    maxWidth: "100%",
    marginVertical: 8,
  },
  imagePlaceholder: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 16,
    borderRadius: 4,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    color: TEXT_COLORS.tertiary,
    fontSize: 10,
  },
  callout: {
    backgroundColor: BACKGROUND_COLORS.layer3, // bg-layer-3 (default callout background)
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    breakInside: "avoid",
  },
  calloutIconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  calloutContent: {
    flex: 1,
    color: TEXT_COLORS.primary, // text-primary
  },
  mention: {
    backgroundColor: MENTION_COLORS.background, // bg-accent-primary/20 equivalent
    color: MENTION_COLORS.text, // text-accent-primary
    padding: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  link: {
    color: LINK_COLORS.primary, // --txt-link-primary
    textDecoration: "underline",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecoration: "underline",
  },
  strike: {
    textDecoration: "line-through",
  },
  // Work item embed styles
  workItemEmbed: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  workItemEmbedIcon: {
    marginRight: 8,
  },
  workItemEmbedText: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
  },
  // Page embed styles
  pageEmbed: {
    backgroundColor: BACKGROUND_COLORS.accentSubtle, // bg-accent-subtle
    padding: 10,
    borderRadius: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: BRAND_COLORS.default,
  },
  pageEmbedIconContainer: {
    marginRight: 8,
  },
  pageEmbedText: {
    color: BRAND_COLORS[900],
    fontWeight: "bold",
  },
  // Page link styles
  pageLink: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  pageLinkIconContainer: {
    marginRight: 6,
  },
  pageLinkText: {
    color: LINK_COLORS.primary,
    textDecoration: "underline",
  },
  // Attachment styles
  attachment: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 10,
    borderRadius: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
  },
  attachmentIconContainer: {
    marginRight: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 9,
    color: TEXT_COLORS.tertiary,
  },
  // External embed styles
  externalEmbed: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 10,
    borderRadius: 4,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
  },
  externalEmbedIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  externalEmbedContent: {
    flex: 1,
  },
  externalEmbedTitle: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
    marginBottom: 4,
  },
  externalEmbedLink: {
    color: LINK_COLORS.primary,
    fontSize: 10,
    textDecoration: "underline",
  },
  // Math styles
  blockMath: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
    alignItems: "center",
  },
  inlineMath: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    fontFamily: "Courier",
    fontSize: 10,
    color: "#7c3aed", // Purple for math (keeping original)
  },
  mathText: {
    fontFamily: "Courier",
    fontSize: 11,
    color: TEXT_COLORS.secondary,
  },
  // DrawIO styles
  drawio: {
    marginVertical: 8,
  },
  drawioImage: {
    maxWidth: "100%",
    maxHeight: 400,
  },
  drawioPlaceholder: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 20,
    borderRadius: 4,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    borderStyle: "dashed",
  },
  drawioPlaceholderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  drawioPlaceholderText: {
    color: TEXT_COLORS.tertiary,
    fontSize: 12,
  },
});
