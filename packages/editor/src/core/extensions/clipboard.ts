import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const MarkdownClipboard = Extension.create({
  name: "markdownClipboard",

  addOptions() {
    return {
      transformPastedText: false,
      transformCopiedText: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownClipboard"),
        props: {
          clipboardTextSerializer: (slice) => {
            const markdownSerializer = this.editor.storage.markdown.serializer;

            const isTableContent =
              slice.content.childCount === 1 &&
              slice.content.firstChild?.type.name === "table";

            const hasMultipleContentBlocks = slice.content.childCount > 2;

            const isWholeSelectionCopied = slice.openStart === 0 && slice.openEnd === 0;

            const listTypes = ["bulletList", "orderedList", "taskList"]
            const isListContent =
              slice.content.childCount === 2 &&
              listTypes.includes(
                slice.content.firstChild?.type.name ?? ""
              );

            let shouldConvertToMarkdown = false;

            if (isTableContent && !isWholeSelectionCopied) {
              const tableNode = slice.content.firstChild;

              if (tableNode.content.firstChild && tableNode.content.firstChild.content.firstChild) {
                const firstTableCell = tableNode.content.firstChild.content.firstChild;
                const cellContainsMultipleBlocks = firstTableCell.content.childCount > 1;

                let containsComplexList = false;
                const listHasMultipleItemsInTable = firstTableCell.content.firstChild!.content!.childCount > 1;
                const cellContainsList = firstTableCell.content.content.some(
                  (node) => listTypes.includes(node.type.name)
                );

                if (cellContainsList && listHasMultipleItemsInTable) {
                  containsComplexList = true;
                }

                const cellContainsOnlyParagraphs = firstTableCell.content.content.every(
                  (node) => node.type.name === "paragraph"
                );

                shouldConvertToMarkdown = this.options.transformCopiedText &&
                  ((!cellContainsOnlyParagraphs && cellContainsMultipleBlocks) ||
                    containsComplexList);
              }
            }
            else if (isListContent) {
              const listNode = slice.content.firstChild;

              if (listNode && listNode.content.firstChild) {
                const listHasMultipleItems = listNode.content.childCount > 2;
                shouldConvertToMarkdown = this.options.transformCopiedText && listHasMultipleItems;
              }
            }
            else {
              shouldConvertToMarkdown = this.options.transformCopiedText &&
                (hasMultipleContentBlocks || isWholeSelectionCopied);
            }

            return shouldConvertToMarkdown
              ? markdownSerializer.serialize(slice.content)
              : slice.content.textBetween(0, slice.content.size, "\n");
          },
        },
      }),
    ];
  },
});
