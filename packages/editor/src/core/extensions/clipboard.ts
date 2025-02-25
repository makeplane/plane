import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from '@tiptap/pm/state';
export function elementFromString(value) {
  // add a wrapper to preserve leading and trailing whitespace
  const wrappedValue = `<body>${value}</body>`

  return new window.DOMParser().parseFromString(wrappedValue, 'text/html').body
}
export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',
  addOptions() {
    return {
      transformPastedText: false,
      transformCopiedText: false,
    }
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          clipboardTextSerializer: (slice) => {
            console.log('clipboardTextSerializer Test', slice)
            if (!this.options.transformCopiedText) {
              return null;
            }
            return this.editor.storage.markdown.serializer.serialize(slice.content);
          },
        }
      })
    ]
  }
})
