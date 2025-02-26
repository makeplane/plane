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
            const hasMultipleBlocks = slice.content.childCount > 1;
            const selectWhole = slice.openStart === 0 && slice.openEnd === 0;
            let handleMarkdown = false;

            if (isTable && !selectWhole) {
              const tableNode = slice.content.firstChild;
              if (
                tableNode.content.firstChild &&
                tableNode.content.firstChild.content.firstChild
              ) {
                const firstCell = tableNode.content.firstChild.content.firstChild;
                const cellHasMultipleBlocks = firstCell.content.childCount > 1;
                const allChildrenAreParagraphs = firstCell.content.content.every(
                  (node) => node.type.name === "paragraph"
                );
                handleMarkdown = this.options.transformCopiedText && !allChildrenAreParagraphs && cellHasMultipleBlocks;
              }
            } else {
              handleMarkdown =
                this.options.transformCopiedText && (hasMultipleBlocks || selectWhole);
            }

            return handleMarkdown
              ? serializer.serialize(slice.content)
              : slice.content.textBetween(0, slice.content.size, "\n");
          },
        },
      }),
    ];
  },
});
