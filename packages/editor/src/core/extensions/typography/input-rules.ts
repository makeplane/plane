import { textInputRule } from "@tiptap/core";

export interface TypographyOptions {
  [key: string]: false | string | undefined;
}

// Define rules configuration
export const TYPOGRAPHY_RULES = {
  emDash: {
    find: /--$/,
    replace: "—",
  },
  impliesArrowRight: {
    find: /=>$/,
    replace: "⇒",
  },
  leftArrow: {
    find: /<-$/,
    replace: "←",
  },
  rightArrow: {
    find: /->$/,
    replace: "→",
  },
  ellipsis: {
    find: /\.\.\.$/,
    replace: "…",
  },
  copyright: {
    find: /\(c\)$/,
    replace: "©",
  },
  trademark: {
    find: /\(tm\)$/,
    replace: "™",
  },
  servicemark: {
    find: /\(sm\)$/,
    replace: "℠",
  },
  registeredTrademark: {
    find: /\(r\)$/,
    replace: "®",
  },
  oneHalf: {
    find: /(?:^|\s)(1\/2)\s$/,
    replace: "½",
  },
  plusMinus: {
    find: /\+\/-$/,
    replace: "±",
  },
  notEqual: {
    find: /!=$/,
    replace: "≠",
  },
  laquo: {
    find: /<<$/,
    replace: "«",
  },
  multiplication: {
    find: /\d+\s?([*x])\s?\d+$/,
    replace: "×",
  },
  superscriptTwo: {
    find: /\^2$/,
    replace: "²",
  },
  superscriptThree: {
    find: /\^3$/,
    replace: "³",
  },
  oneQuarter: {
    find: /(?:^|\s)(1\/4)\s$/,
    replace: "¼",
  },
  threeQuarters: {
    find: /(?:^|\s)(3\/4)\s$/,
    replace: "¾",
  },
} as const;

export const createInputRule = (key: keyof typeof TYPOGRAPHY_RULES, override: string | false | undefined) => {
  if (override === false) return null;
  return textInputRule({
    find: TYPOGRAPHY_RULES[key].find,
    replace: override || TYPOGRAPHY_RULES[key].replace,
  });
};
