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
import { BACKGROUND_COLORS, BORDER_COLORS, BRAND_COLORS, LINK_COLORS, MENTION_COLORS, TEXT_COLORS } from "./colors";

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingHorizontal: 72,
    paddingBottom: 68,
    fontFamily: "Noto Sans CJK",
    fontSize: 8,
    lineHeight: 1.45,
    color: TEXT_COLORS.primary,
  },
  titleContainer: {
    width: "100%",
    maxWidth: "100%",
    marginTop: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.12,
    color: TEXT_COLORS.primary,
    maxWidth: "100%",
  },
  titleMedium: {
    fontSize: 17,
    lineHeight: 1.14,
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 1.18,
  },
  heading1: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.12,
    marginTop: 16,
    marginBottom: 4,
    color: TEXT_COLORS.primary,
  },
  heading2: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.14,
    marginTop: 12,
    marginBottom: 4,
    color: TEXT_COLORS.primary,
  },
  heading3: {
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.18,
    marginTop: 10,
    marginBottom: 4,
    color: TEXT_COLORS.primary,
  },
  heading4: {
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1.2,
    marginTop: 8,
    marginBottom: 4,
    color: TEXT_COLORS.secondary,
  },
  heading5: {
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.22,
    marginTop: 8,
    marginBottom: 4,
    color: TEXT_COLORS.secondary,
  },
  heading6: {
    fontSize: 8,
    fontWeight: 600,
    lineHeight: 1.24,
    marginTop: 8,
    marginBottom: 4,
    color: TEXT_COLORS.tertiary,
  },
  paragraph: {
    marginBottom: 0,
    minWidth: 0,
  },
  paragraphWrapper: {
    marginBottom: 6,
    minWidth: 0,
  },
  tableText: {
    fontSize: 7,
    lineHeight: 1.35,
  },
  shrinkableContent: {
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
  constrainedText: {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: BORDER_COLORS.strong, // Matches .ProseMirror blockquote border-strong
    paddingLeft: 8,
    marginLeft: 0,
    marginVertical: 6,
    fontStyle: "normal", // Matches editor: font-style: normal
    fontWeight: 400, // Matches editor: font-weight: 400
    color: TEXT_COLORS.primary,
    breakInside: "avoid",
  },
  codeBlock: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
  },
  codeBlockText: {
    fontFamily: "Courier",
    fontSize: 8,
    lineHeight: 1.35,
    color: TEXT_COLORS.secondary,
  },
  list: {
    marginVertical: 2,
    paddingLeft: 0,
  },
  listItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 2,
    paddingRight: 6,
    alignItems: "flex-start",
  },
  listItemBullet: {
    width: 14,
    marginRight: 2,
    alignItems: "flex-end",
  },
  listItemMarker: {
    fontSize: 8,
    lineHeight: 1.45,
  },
  listItemContent: {
    flex: 1,
    minWidth: 0,
  },
  taskList: {
    marginVertical: 2,
  },
  taskItem: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
    paddingRight: 6,
  },
  taskCheckbox: {
    width: 8.5,
    height: 8.5,
    borderWidth: 1,
    borderColor: BORDER_COLORS.strong,
    borderRadius: 1.5,
    marginTop: 1.5,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxChecked: {
    backgroundColor: BRAND_COLORS.default,
    borderColor: BRAND_COLORS.default,
  },
  table: {
    width: "100%",
    marginTop: 6,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle, // Matches editor table outer border
  },
  tableRow: {
    flexDirection: "row",
    breakInside: "avoid",
  },
  tableHeaderRow: {
    flexDirection: "row",
    breakInside: "avoid",
  },
  tableCellBase: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLORS.subtle1,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLORS.subtle1,
    minWidth: 0,
    overflow: "hidden",
  },
  tableHeaderCellExtra: {
    fontWeight: 600,
    backgroundColor: BACKGROUND_COLORS.layer1,
  },
  tableCellPlaceholder: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  columnList: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 6,
    minWidth: 0,
    width: "100%",
  },
  column: {
    minWidth: 0,
  },
  horizontalRule: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLORS.subtle1, // Matches div[data-type="horizontalRule"] border-subtle-1
    marginVertical: 12,
  },
  image: {
    maxWidth: "100%",
    marginVertical: 6,
  },
  imagePlaceholder: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 12,
    borderRadius: 3,
    marginVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    color: TEXT_COLORS.tertiary,
    fontSize: 8,
  },
  callout: {
    backgroundColor: BACKGROUND_COLORS.layer3, // bg-layer-3 (default callout background)
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    breakInside: "avoid",
  },
  calloutIconContainer: {
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  calloutEmoji: {
    width: 14,
    height: 14,
  },
  calloutContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-start",
    color: TEXT_COLORS.primary, // text-primary
  },
  mention: {
    backgroundColor: MENTION_COLORS.background, // bg-accent-primary/20 equivalent
    color: MENTION_COLORS.text, // text-accent-primary
    paddingVertical: 1,
    paddingHorizontal: 3,
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
    borderRadius: 3,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    minWidth: 0,
  },
  workItemEmbedIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  workItemEmbedContent: {
    flex: 1,
    minWidth: 0,
  },
  workItemEmbedText: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
  },
  workItemEmbedSubtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 2,
  },
  // Page embed styles
  pageEmbed: {
    backgroundColor: BACKGROUND_COLORS.accentSubtle, // bg-accent-subtle
    padding: 8,
    borderRadius: 3,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: BRAND_COLORS.default,
    minWidth: 0,
  },
  pageEmbedIconContainer: {
    marginRight: 8,
    flexShrink: 0,
  },
  pageEmbedContent: {
    flex: 1,
    minWidth: 0,
  },
  pageEmbedText: {
    color: BRAND_COLORS[900],
    fontWeight: "bold",
  },
  // Page link styles
  pageLink: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 6,
    borderRadius: 3,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  pageLinkIconContainer: {
    marginRight: 6,
    flexShrink: 0,
  },
  pageLinkContent: {
    flex: 1,
    minWidth: 0,
  },
  pageLinkText: {
    color: LINK_COLORS.primary,
    textDecoration: "underline",
  },
  // Attachment styles
  attachment: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 8,
    borderRadius: 3,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    minWidth: 0,
  },
  attachmentIconContainer: {
    marginRight: 10,
    flexShrink: 0,
  },
  attachmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  attachmentName: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 7,
    color: TEXT_COLORS.tertiary,
  },
  // External embed styles
  externalEmbed: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 8,
    borderRadius: 3,
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    minWidth: 0,
  },
  externalEmbedIconContainer: {
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  externalEmbedContent: {
    flex: 1,
    minWidth: 0,
  },
  externalEmbedTitle: {
    fontWeight: "bold",
    color: TEXT_COLORS.secondary,
    marginBottom: 4,
  },
  externalEmbedLink: {
    color: LINK_COLORS.primary,
    fontSize: 8,
    textDecoration: "underline",
  },
  aiBlock: {
    backgroundColor: BACKGROUND_COLORS.layer2,
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: BORDER_COLORS.subtle,
    minWidth: 0,
  },
  // Math styles
  blockMath: {
    backgroundColor: BACKGROUND_COLORS.surface2,
    padding: 8,
    borderRadius: 3,
    marginVertical: 6,
    alignItems: "center",
  },
  inlineMath: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    fontFamily: "Courier",
    fontSize: 8,
    color: "#7c3aed", // Purple for math (keeping original)
  },
  mathText: {
    fontFamily: "Courier",
    fontSize: 8,
    color: TEXT_COLORS.secondary,
  },
  // DrawIO styles
  drawio: {
    marginVertical: 6,
  },
  drawioImage: {
    maxWidth: "100%",
    maxHeight: 400,
  },
  drawioPlaceholder: {
    backgroundColor: BACKGROUND_COLORS.layer1,
    padding: 12,
    borderRadius: 3,
    marginVertical: 6,
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
    fontSize: 9,
  },
  footerTitle: {
    position: "absolute",
    left: 27,
    bottom: 28,
    fontSize: 7.5,
    color: TEXT_COLORS.tertiary,
  },
  footerPageNumber: {
    position: "absolute",
    right: 27,
    bottom: 28,
    width: 18,
    textAlign: "right",
    fontSize: 7.5,
    color: TEXT_COLORS.tertiary,
  },
});
