import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const MarkdownClipboard = Extension.create({
  name: "markdownClipboard",
  addOptions() {
    return {
      transformCopiedText: false,
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownClipboard"),
        props: {
          clipboardTextSerializer: (slice) => {
            // if (!this.options.transformCopiedText) {
            //   return null;
            // }
            console.log(
              "this.editor.storage.markdown.serializer.serialize(slice.content)",
              this.editor.storage.markdown.serializer.serialize(slice.content)
            );
            return this.editor.storage.markdown.serializer.serialize(slice.content);
          },
        },
      }),
    ];
  },
});
