import { PasteRule } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
// types
import { EMathAttributeNames } from "../types";

const inlineMathPasteRegex = /(?<!\$)\$([^$\n]+)\$(?!\$)/g;

export const inlineMathPasteRules = (nodeType: NodeType, isFlagged: boolean) => [
  new PasteRule({
    find: inlineMathPasteRegex,
    handler: ({ state, range, match }) => {
      if (isFlagged) {
        return;
      }
      const [, latex] = match;
      const trimmedLatex = latex.trim();
      const { tr } = state;
      const start = range.from;
      const end = range.to;

      // Create the inline math node
      const inlineMathNode = nodeType.create({
        [EMathAttributeNames.LATEX]: trimmedLatex,
      });

      // Replace the matched text with the inline math node
      tr.replaceWith(start, end, inlineMathNode);
    },
  }),
];
