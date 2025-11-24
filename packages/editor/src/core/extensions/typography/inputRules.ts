import { textInputRule } from "@tiptap/core";

export type TypographyOptions = {
  emDash: false | string;
  ellipsis: false | string;
  leftArrow: false | string;
  rightArrow: false | string;
  copyright: false | string;
  trademark: false | string;
  servicemark: false | string;
  registeredTrademark: false | string;
  oneHalf: false | string;
  plusMinus: false | string;
  notEqual: false | string;
  laquo: false | string;
  raquo: false | string;
  multiplication: false | string;
  superscriptTwo: false | string;
  superscriptThree: false | string;
  oneQuarter: false | string;
  threeQuarters: false | string;
  impliesArrowRight: false | string;
};

export const emDash = (override?: string) =>
  textInputRule({
    find: /--$/,
    replace: override ?? "—",
  });

export const impliesArrowRight = (override?: string) =>
  textInputRule({
    find: /=>$/,
    replace: override ?? "⇒",
  });

export const leftArrow = (override?: string) =>
  textInputRule({
    find: /<-$/,
    replace: override ?? "←",
  });

export const rightArrow = (override?: string) =>
  textInputRule({
    find: /->$/,
    replace: override ?? "→",
  });

export const ellipsis = (override?: string) =>
  textInputRule({
    find: /\.\.\.$/,
    replace: override ?? "…",
  });

export const copyright = (override?: string) =>
  textInputRule({
    find: /\(c\)$/,
    replace: override ?? "©",
  });

export const trademark = (override?: string) =>
  textInputRule({
    find: /\(tm\)$/,
    replace: override ?? "™",
  });

export const servicemark = (override?: string) =>
  textInputRule({
    find: /\(sm\)$/,
    replace: override ?? "℠",
  });

export const registeredTrademark = (override?: string) =>
  textInputRule({
    find: /\(r\)$/,
    replace: override ?? "®",
  });

export const oneHalf = (override?: string) =>
  textInputRule({
    find: /(?:^|\s)(1\/2)\s$/,
    replace: override ?? "½",
  });

export const plusMinus = (override?: string) =>
  textInputRule({
    find: /\+\/-$/,
    replace: override ?? "±",
  });

export const notEqual = (override?: string) =>
  textInputRule({
    find: /!=$/,
    replace: override ?? "≠",
  });

export const laquo = (override?: string) =>
  textInputRule({
    find: /<<$/,
    replace: override ?? "«",
  });

export const raquo = (override?: string) =>
  textInputRule({
    find: />>$/,
    replace: override ?? "»",
  });

export const multiplication = (override?: string) =>
  textInputRule({
    find: /\d+\s?([*x])\s?\d+$/,
    replace: override ?? "×",
  });

export const superscriptTwo = (override?: string) =>
  textInputRule({
    find: /\^2$/,
    replace: override ?? "²",
  });

export const superscriptThree = (override?: string) =>
  textInputRule({
    find: /\^3$/,
    replace: override ?? "³",
  });

export const oneQuarter = (override?: string) =>
  textInputRule({
    find: /(?:^|\s)(1\/4)\s$/,
    replace: override ?? "¼",
  });

export const threeQuarters = (override?: string) =>
  textInputRule({
    find: /(?:^|\s)(3\/4)\s$/,
    replace: override ?? "¾",
  });
