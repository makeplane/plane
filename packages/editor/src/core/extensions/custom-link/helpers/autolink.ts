import {
  combineTransactionSteps,
  findChildrenInRange,
  getChangedRanges,
  getMarksBetween,
  NodeWithPos,
} from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { find } from "linkifyjs";

type AutolinkOptions = {
  type: MarkType;
  validate?: (url: string) => boolean;
};

export function autolink(options: AutolinkOptions): Plugin {
  return new Plugin({
    key: new PluginKey("autolink"),
    appendTransaction: (transactions, oldState, newState) => {
      const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
      const preventAutolink = transactions.some((transaction) => transaction.getMeta("preventAutolink"));

      if (!docChanges || preventAutolink) {
        return;
      }

      const { tr } = newState;
      const transform = combineTransactionSteps(oldState.doc, [...transactions]);
      const changes = getChangedRanges(transform);

      changes.forEach(({ newRange }) => {
        // Now let’s see if we can add new links.
        const nodesInChangedRanges = findChildrenInRange(newState.doc, newRange, (node) => node.isTextblock);

        let textBlock: NodeWithPos | undefined;
        let textBeforeWhitespace: string | undefined;

        if (nodesInChangedRanges.length > 1) {
          // Grab the first node within the changed ranges (ex. the first of two paragraphs when hitting enter).
          textBlock = nodesInChangedRanges[0];
          textBeforeWhitespace = newState.doc.textBetween(
            textBlock.pos,
            textBlock.pos + textBlock.node.nodeSize,
            undefined,
            " "
          );
        } else if (
          nodesInChangedRanges.length &&
          // We want to make sure to include the block seperator argument to treat hard breaks like spaces.
          newState.doc.textBetween(newRange.from, newRange.to, " ", " ").endsWith(" ")
        ) {
          textBlock = nodesInChangedRanges[0];
          textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, newRange.to, undefined, " ");
        }

        if (textBlock && textBeforeWhitespace) {
          const wordsBeforeWhitespace = textBeforeWhitespace.split(" ").filter((s) => s !== "");

          if (wordsBeforeWhitespace.length <= 0) {
            return false;
          }

          const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
          const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);

          if (!lastWordBeforeSpace) {
            return false;
          }

          find(lastWordBeforeSpace)
            .filter((link) => link.isLink)
            // Calculate link position.
            .map((link) => ({
              ...link,
              from: lastWordAndBlockOffset + link.start + 1,
              to: lastWordAndBlockOffset + link.end + 1,
            }))
            // ignore link inside code mark
            .filter((link) => {
              if (!newState.schema.marks.code) {
                return true;
              }

              return !newState.doc.rangeHasMark(link.from, link.to, newState.schema.marks.code);
            })
            // validate link
            .filter((link) => {
              if (options.validate) {
                return options.validate(link.value);
              }
              return true;
            })
            // Add link mark.
            .forEach((link) => {
              if (getMarksBetween(link.from, link.to, newState.doc).some((item) => item.mark.type === options.type)) {
                return;
              }

              tr.addMark(
                link.from,
                link.to,
                options.type.create({
                  href: link.href,
                })
              );
            });
        }
      });

      if (!tr.steps.length) {
        return;
      }

      return tr;
    },
  });
}
