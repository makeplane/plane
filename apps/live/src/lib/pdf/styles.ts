/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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
    fontFamily: "Inter",
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
    backgroundColor: BACKGROUND_COLORS.layer1, // bg-layer-1 equivalent
    padding: 12,
    borderRadius: 4,
    fontFamily: "Courier",
    fontSize: 10,
    marginVertical: 8,
    color: TEXT_COLORS.primary,
    breakInside: "avoid",
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
    gap: 6,
    marginBottom: 4,
    paddingRight: 10,
    breakInside: "avoid",
  },
  listItemBullet: {},
  listItemContent: {
    flex: 1,
  },
  taskList: {
    marginVertical: 8,
  },
  taskItem: {
    display: "flex",
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
    alignItems: "flex-start",
    paddingRight: 10,
    breakInside: "avoid",
  },
  taskCheckbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BORDER_COLORS.strong, // Matches editor: border-strong
    borderRadius: 2,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  taskCheckboxChecked: {
    backgroundColor: BRAND_COLORS.default, // --background-color-accent-primary
    borderColor: BRAND_COLORS.default, // --border-color-accent-strong
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
});
