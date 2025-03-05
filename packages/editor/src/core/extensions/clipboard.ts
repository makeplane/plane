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
            const isTableRow = slice.content.firstChild?.type?.name === 'tableRow';
            const nodeSelect = slice.openStart === 0 && slice.openEnd === 0;
            if (nodeSelect) {
              return markdownSerializer.serialize(slice.content);
            }

            const processTableContent = (tableNode: Node | Fragment) => {
              let result = '';
              tableNode.content?.forEach?.((tableRowNode: Node | Fragment) => {
                tableRowNode.content?.forEach?.((cell: Node) => {
                  const cellContent = cell.content ? markdownSerializer.serialize(cell.content) : '';
                  result += cellContent + '\n';
                });
              });
              return result;
            };

            if (isTableRow) {
              const rowsCount = slice.content?.childCount || 0
              const cellsCount = slice.content?.firstChild?.content?.childCount || 0;
              if (rowsCount === 1 || cellsCount === 1) {
                return processTableContent(slice.content)
              } else {
                return markdownSerializer.serialize(slice.content);
              }
            }

            const traverseToParentOfLeaf = (node: Node | null, parent: Fragment | Node, depth: number): Node | Fragment => {
              if (!node || depth <= 1 || !node.content?.firstChild) {
                return parent;
              }
              if (node.content?.childCount > 1) {
                if (node.content.firstChild?.type?.name === 'listItem') {
                  return parent;
                } else {
                  return node.content;
                }
              }
              return traverseToParentOfLeaf(node.content?.firstChild || null, node, depth - 1);
            };

            const targetNode = traverseToParentOfLeaf(slice.content.firstChild, slice.content, slice.openStart);
            return markdownSerializer.serialize(targetNode);
          },
        },
      }),
    ];
  },
});
