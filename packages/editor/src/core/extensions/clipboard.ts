import { serialize } from "node:v8";
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
            const isNodeSelected = slice.openStart === 0 && slice.openEnd === 0;
            const listTypes = ["bulletList", "orderedList"];
            const taskList = 'taskList';
            const table = 'table'
            const isTableRow = slice.content.firstChild?.type.name === 'tableRow';

            const processTableContent = (tableNode: Node | Fragment) => {
              let result = '';
              tableNode.content.forEach((tableRowNode: Node | Fragment) => {
                tableRowNode.content.forEach((cell: Node) => {
                  const cellContent = markdownSerializer.serialize(cell.content);
                  result += cellContent + '\n';
                });
              });
              return result;
            };

            if (isTableRow) {
              const rowsCount = slice.content.childCount;
              const cellsCount = slice.content.firstChild.content.childCount;
              if (rowsCount === 1 || cellsCount === 1) {
                return processTableContent(slice.content)
              } else {
                return markdownSerializer.serialize(slice.content);
              }
            }

            if (isNodeSelected) {
              return markdownSerializer.serialize(slice.content);
            } else {
              const mulitpleNodes = slice.content.childCount > 1;
              if (!mulitpleNodes) {

                // handle Paragraph
                if (slice.content.firstChild?.type.name === 'paragraph') {
                  return markdownSerializer.serialize(slice.content)
                }

                // handle list
                const isListContent =
                  slice.content.childCount === 1 &&
                  listTypes.includes(slice.content.firstChild?.type.name ?? "");

                if (isListContent) {
                  if (slice.content.firstChild?.childCount === 1) {
                    return markdownSerializer.serialize(slice.content.firstChild?.content)
                  } else {
                    return markdownSerializer.serialize(slice.content)
                  }
                }

                // handle tasklist
                const isTaskList =
                  slice.content.childCount === 1 && slice.content.firstChild?.type.name === taskList
                if (isTaskList) {
                  if (slice.content.firstChild?.childCount === 1) {
                    let result = '';
                    slice.content.firstChild?.content.forEach((taskItem: Node) => {
                      const taskItemContent = markdownSerializer.serialize(taskItem.content);
                      result += taskItemContent + '\n';
                    });
                    return result;
                  } else {
                    return markdownSerializer.serialize(slice.content)
                  }
                }

                // handle table
                const isTable = slice.content.childCount === 1 && slice.content.firstChild?.type.name === table
                if (isTable) {
                  const tableNode = slice.content.firstChild;
                  const isSingleCell = tableNode.content.childCount === 1 && tableNode.content.firstChild?.childCount === 1;
                  // Handle single cell table
                  if (isSingleCell) {
                    const firstTableCell = tableNode.content.firstChild.content.firstChild;
                    const cellContainsMultipleBlocks = firstTableCell!.content.childCount > 1;
                    const allNodes = firstTableCell!.content.content;
                    const hasMultipleTypes = new Set(allNodes.map(n => n.type.name)).size > 1;

                    if (cellContainsMultipleBlocks && hasMultipleTypes) {
                      return markdownSerializer.serialize(tableNode.content.firstChild?.content.firstChild);
                    } else {
                      const tableCell = tableNode.content.firstChild?.content.firstChild?.content;
                      const firstChildType = tableCell?.firstChild?.type.name;
                      const isListOrTaskList = firstChildType && (listTypes.includes(firstChildType) || firstChildType === taskList);

                      if (isListOrTaskList) {
                        return markdownSerializer(tableNode.content.firstChild?.content.firstChild);
                      } else {
                        return markdownSerializer.serialize(tableNode.content.firstChild?.content.firstChild);
                      }
                    }
                  }
                }
                // handle block Node
                const isblockNode = slice.content.childCount === 1 && slice.content.firstChild?.type.isInGroup('block');
                if (isblockNode) {
                  return markdownSerializer.serialize(slice.content.firstChild?.content)
                }
              } else {
                return markdownSerializer.serialize(slice.content);
              }
            }
          },
        },
      }),
    ];
  },
});
