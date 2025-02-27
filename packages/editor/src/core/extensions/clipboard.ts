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
            const serializer = this.editor.storage.markdown.serializer;
            const isTable =
              slice.content.childCount === 1 &&
              slice.content.firstChild?.type.name === "table";
            const hasMultipleBlocks = slice.content.childCount > 2;
            const selectWhole = slice.openStart === 0 && slice.openEnd === 0;
            const isList =
              slice.content.childCount === 2 &&
              ["bulletList", "orderedList", "taskList"].includes(
                slice.content.firstChild?.type.name ?? ""
              );

            let handleMarkdown = false;

            if (isTable && !selectWhole) {
              const tableNode = slice.content.firstChild;
              if (
                tableNode.content.firstChild &&
                tableNode.content.firstChild.content.firstChild
              ) {
                const firstCell = tableNode.content.firstChild.content.firstChild;
                const cellHasMultipleBlocks = firstCell.content.childCount > 1;

                let handleList = false;
                const listhasmultiintabl = firstCell.content.firstChild!.content!.childCount > 1;

                const containsLists = firstCell.content.content.some(
                  (node) =>
                    ["bulletList", "orderedList", "taskList"].includes(node.type.name)
                );

                if (containsLists && listhasmultiintabl) {
                  handleList = true;
                }

                const allChildrenAreParagraphs = firstCell.content.content.every(
                  (node) => node.type.name === "paragraph"
                );

                console.log(allChildrenAreParagraphs, cellHasMultipleBlocks, handleList)
                handleMarkdown =
                  this.options.transformCopiedText &&
                  (!allChildrenAreParagraphs && cellHasMultipleBlocks || handleList);
              }
            } else if (isList) {
              const firstCell = slice.content.firstChild;
              if (firstCell && firstCell.content.firstChild) {
                const listHasMultipleBlocks = firstCell.content.childCount > 2;
                handleMarkdown = this.options.transformCopiedText && listHasMultipleBlocks;
              }
            } else {
              console.log('else')
              handleMarkdown =
                this.options.transformCopiedText && (hasMultipleBlocks || selectWhole);
            }

            console.log(handleMarkdown, 'U2', slice);
            return handleMarkdown
              ? serializer.serialize(slice.content)
              : slice.content.textBetween(0, slice.content.size, "\n");
          },
        },
      }),
    ];
  },
});
