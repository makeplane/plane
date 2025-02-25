import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',

  addOptions() {
    return {
      transformPastedText: false,
      transformCopiedText: true,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          clipboardTextSerializer: (slice) => {
            const serializer = this.editor.storage.markdown.serializer;
            const hasMultipleBlocks = slice.content.childCount > 1;
            const hasOpenAndCloseEnd = slice.openStart === 0 && slice.openEnd === 0;
            const handleMarkdown = this.options.transformCopiedText && (hasMultipleBlocks || hasOpenAndCloseEnd);
            if (handleMarkdown) {
              return serializer.serialize(slice.content);
            } else {
              return slice.content.textBetween(0, slice.content.size, "\n");
            }
          }
        }
      })
    ]
  }
});
