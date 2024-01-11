import { markInputRule, markPasteRule } from "@tiptap/core";
import Code from "@tiptap/extension-code";

export const inputRegex = /(?<!`)`([^`]*)`(?!`)/;
export const pasteRegex = /(?<!`)`([^`]+)`(?!`)/g;

export const CustomCodeInlineExtension = Code.extend({
  exitable: true,
  inclusive: false,
  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ];
  },
}).configure({
  HTMLAttributes: {
    class: "rounded-md bg-custom-primary-30 mx-1 px-1 py-[2px] font-mono font-medium text-custom-text-1000",
    spellcheck: "false",
  },
});
