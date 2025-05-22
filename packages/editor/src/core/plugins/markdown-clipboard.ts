import { Editor } from "@tiptap/core";
import { Fragment, Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

export const MarkdownClipboardPlugin = (editor: Editor): Plugin =>
  new Plugin({
    key: new PluginKey("markdownClipboard"),
    props: {
      clipboardTextSerializer: (slice) => {
        const markdownSerializer = editor.storage.markdown.serializer;
        const isTableRow = slice.content.firstChild?.type?.name === CORE_EXTENSIONS.TABLE_ROW;
        const nodeSelect = slice.openStart === 0 && slice.openEnd === 0;

        if (nodeSelect) {
          return markdownSerializer.serialize(slice.content);
        }

        const processTableContent = (tableNode: Node | Fragment) => {
          let result = "";
          tableNode.content?.forEach?.((tableRowNode: Node | Fragment) => {
            tableRowNode.content?.forEach?.((cell: Node) => {
              const cellContent = cell.content ? markdownSerializer.serialize(cell.content) : "";
              result += cellContent + "\n";
            });
          });
          return result;
        };

        if (isTableRow) {
          const rowsCount = slice.content?.childCount || 0;
          const cellsCount = slice.content?.firstChild?.content?.childCount || 0;
          if (rowsCount === 1 || cellsCount === 1) {
            return processTableContent(slice.content);
          } else {
            return markdownSerializer.serialize(slice.content);
          }
        }

        const traverseToParentOfLeaf = (node: Node | null, parent: Fragment | Node, depth: number): Node | Fragment => {
          let currentNode = node;
          let currentParent = parent;
          let currentDepth = depth;

          while (currentNode && currentDepth > 1 && currentNode.content?.firstChild) {
            if (currentNode.content?.childCount > 1) {
              if (currentNode.content.firstChild?.type?.name === CORE_EXTENSIONS.LIST_ITEM) {
                return currentParent;
              } else {
                return currentNode.content;
              }
            }

            currentParent = currentNode;
            currentNode = currentNode.content?.firstChild || null;
            currentDepth--;
          }

          return currentParent;
        };

        if (slice.content.childCount > 1) {
          return markdownSerializer.serialize(slice.content);
        } else {
          const targetNode = traverseToParentOfLeaf(slice.content.firstChild, slice.content, slice.openStart);

          let currentNode = targetNode;
          while (currentNode && currentNode.content && currentNode.childCount === 1 && currentNode.firstChild) {
            currentNode = currentNode.firstChild;
          }
          if (currentNode instanceof Node && currentNode.isText) {
            return currentNode.text;
          }

          return markdownSerializer.serialize(targetNode);
        }
      },
    },
  });
