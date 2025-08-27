import { PasteRule } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
// types
import { EMathAttributeNames } from "../types";

const blockMathPasteRegex = /(?<!\$)\$\$([^$]+)\$\$(?!\$)/g;

export const blockMathPasteRules = (nodeType: NodeType, isFlagged: boolean) => [
  new PasteRule({
    find: blockMathPasteRegex,
    handler: ({ state, range, match }) => {
      if (isFlagged) {
        return;
      }
      const [, latex] = match;
      const trimmedLatex = latex.trim();
      const { tr } = state;
      const start = range.from;
      const end = range.to;

      // Create the block math node
      const blockMathNode = nodeType.create({
        [EMathAttributeNames.LATEX]: trimmedLatex,
      });

      // For block math, we want to replace the matched text and ensure it's on its own line
      tr.replaceWith(start, end, blockMathNode);
    },
  }),
];
