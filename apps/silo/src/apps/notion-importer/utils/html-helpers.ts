import { parse } from "node-html-parser";

export const NOTION_COLOR_MAP = new Map([
  ["brown", "peach"],
  ["gray", "gray"],
  ["red", "peach"],
  ["orange", "orange"],
  ["yellow", "green"],
  ["blue", "light-blue"],
  ["purple", "purple"],
  ["pink", "pink"],
  ["teal", "dark-blue"],
]);

export const getEmojiFromHtmlHeader = (htmlContent: string) => {
  const root = parse(htmlContent);
  const iconElement = root.querySelector(".page-header-icon .icon");
  return iconElement ? iconElement.textContent.trim() : null;
};

export const getEmojiPayload = (htmlContent: string) => {
  const emoji = getEmojiFromHtmlHeader(htmlContent);
  if (!emoji) return null;

  // Get the Unicode code point of the emoji
  const codePoint = emoji.codePointAt(0);

  if (!codePoint) return null;

  // Convert to hex for URL (without 0x prefix, lowercase, and padded to at least 4 digits)
  const hexCode = codePoint.toString(16).padStart(4, "0");

  return {
    emoji: {
      url: `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hexCode}.png`,
      value: codePoint.toString(),
    },
    in_use: "emoji",
  };
};
