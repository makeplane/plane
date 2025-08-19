import { InputRule } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
// types
import { EMathAttributeNames } from "../types";

export const blockMathInputRules = (nodeType: NodeType, isFlagged: boolean) => [
  new InputRule({
    find: /(?<!\$)\$\$([^$\n]+)\$\$(?!\$)$/,
    handler: ({ state, range, match }) => {
      if (isFlagged) {
        return;
      }
      const [, latex] = match;
      const trimmedLatex = latex.trim();
      const { tr } = state;
      const start = range.from;
      const end = range.to;

      tr.replaceWith(
        start,
        end,
        nodeType.create({
          [EMathAttributeNames.LATEX]: trimmedLatex,
        })
      );
    },
  }),
];
