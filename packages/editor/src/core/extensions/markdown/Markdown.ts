import { Extension } from "@tiptap/core";
import { MarkdownClipboard } from "./extensions/tiptap/clipboard";
import { MarkdownParser } from "./parse/markdown-parser";
import { MarkdownSerializer } from "./serialize/markdown-serializer";

declare module "@tiptap/core" {
  interface EditorOptions {
    initialContent?: string;
  }
}

export const MarkdownCopy = Extension.create<{
  html: boolean;
  tightLists: boolean;
  tightListClass: string;
  bulletListMarker: string;
  linkify: boolean;
  transformCopiedText: boolean;
  transformPastedText: boolean;
  breaks: boolean;
}>({
  name: "markdownCopy",
  priority: 50,
  addOptions() {
    return {
      html: false,
      tightLists: true,
      tightListClass: "tight",
      bulletListMarker: "-",
      linkify: false,
      breaks: false,
      transformPastedText: false,
      transformCopiedText: false,
    };
  },
  addCommands() {
    return {
      setContent:
        (content: string, emitUpdate?: boolean, parseOptions?: Record<string, any>) =>
        ({ editor }) =>
          editor.commands.setContent(editor.storage.markdown.parser.parse(content), emitUpdate, parseOptions),
      insertContentAt:
        (range: any, content: string, options?: Record<string, any>) =>
        ({ editor }) =>
          editor.commands.insertContentAt(
            range,
            editor.storage.markdown.parser.parse(content, { inline: true }),
            options
          ),
    };
  },
  onBeforeCreate() {
    this.editor.storage.markdown = {
      options: { ...this.options },
      parser: new MarkdownParser(this.editor, this.options),
      serializer: new MarkdownSerializer(this.editor),
      getMarkdown: () => this.editor.storage.markdown.serializer.serialize(this.editor.state.doc),
    };
    const content =
      typeof this.editor.options.content === "string"
        ? this.editor.options.content
        : this.editor.storage.markdown.serializer.serialize(this.editor.options.content);
    this.editor.options.initialContent = content;
    this.editor.options.content = this.editor.storage.markdown.parser.parse(content);
  },
  onCreate() {
    this.editor.options.content = this.editor.options.initialContent;
    delete this.editor.options.initialContent;
  },
  addStorage() {
    return {
      /// storage will be defined in onBeforeCreate() to prevent initial object overriding
    };
  },
  addExtensions() {
    return [
      // MarkdownTightLists.configure({
      //   tight: this.options.tightLists,
      //   tightClass: this.options.tightListClass,
      // }),
      MarkdownClipboard.configure({
        transformPastedText: this.options.transformPastedText,
        transformCopiedText: this.options.transformCopiedText,
      }),
    ];
  },
});
