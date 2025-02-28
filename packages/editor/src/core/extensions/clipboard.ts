import { Extension } from "@tiptap/core";
import { Fragment, Node } from "@tiptap/pm/model";
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
            const listTypes = ["bulletList", "orderedList", "taskList"];

            const processTableContent = (tableNode: Node | Fragment) => {
              let result = '';
              tableNode.content.forEach((tableRowNode: Node | Fragment) => {
                const rowContent: string[] = [];
                tableRowNode.content.forEach((cell) => {
                  const cellContent = markdownSerializer.serialize(cell.content);
                  rowContent.push(cellContent);
                });
                result += rowContent.join('\t') + '\n';
              });
              return result;
            };

            const isTableContent =
              slice.content.childCount === 1 &&
              slice.content.firstChild?.type.name === "table";

            const isTableRow = slice.content.firstChild?.type.name === 'tableRow';
            const hasMultipleContentBlocks = slice.content.childCount > 1;
            const isWholeSelectionCopied = slice.openStart === 0 && slice.openEnd === 0;
            const isListContent =
              slice.content.childCount === 1 &&
              listTypes.includes(slice.content.firstChild?.type.name ?? "");
            let shouldConvertToMarkdown = false;

            let result = '';
            const multiNode = slice.content.childCount > 1;
            if (multiNode) {
              let containsTable = false;
              slice.content.forEach((contentNode: Node) => {
                if (contentNode.type.name === 'table') {
                  containsTable = true;
                  result += processTableContent(contentNode);
                } else {
                  result += markdownSerializer.serialize(contentNode);
                }
              });
              if (containsTable) {
                return result;
              }
            }


            if (isTableContent && isWholeSelectionCopied) {
              return processTableContent(slice.content.firstChild);
            }

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

                const allNodes = firstTableCell.content.content;
                const hasMultipleTypes = new Set(allNodes.map(n => n.type.name)).size > 1;

                if (hasMultipleTypes) {
                  return markdownSerializer.serialize(
                    slice.content.firstChild.content.firstChild?.content.firstChild?.content
                  );
                }

                if (cellContainsList && listHasMultipleItemsInTable) {
                  containsComplexList = true;
                  return markdownSerializer.serialize(
                    slice.content.firstChild.content.firstChild?.content.firstChild?.content
                  );
                }

                const cellContainsOnlyParagraphs = firstTableCell.content.content.every(
                  (node) => node.type.name === "paragraph"
                );

                const isTableWithMultipleRowsOrCells = (() => {
                  if (isTableContent) {
                    const tableNode = slice.content.firstChild;
                    const hasMultipleRows = tableNode.content.childCount > 1;
                    let hasMultipleCells = false;

                    tableNode.content.forEach(row => {
                      if (row.content.childCount > 1) {
                        hasMultipleCells = true;
                      }
                    });

                    return hasMultipleRows || hasMultipleCells;
                  }
                  return false;
                })();

                if (isTableWithMultipleRowsOrCells) {
                  return processTableContent(slice.content.firstChild);
                }

                shouldConvertToMarkdown = this.options.transformCopiedText &&
                  ((!cellContainsOnlyParagraphs && cellContainsMultipleBlocks) ||
                    containsComplexList);
              }
            }
            else if (isTableRow) {
              return processTableContent(slice.content);
            }
            else if (isListContent) {
              const listNode = slice.content.firstChild;

              if (listNode && listNode.content.firstChild) {
                const listHasMultipleItems = listNode.content.childCount > 1;
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
