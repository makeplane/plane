import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// plane imports
import { convertHTMLToMarkdown } from "@plane/utils";
import type { TCustomComponentsMetaData } from "@plane/utils";

type TArgs = {
  editor: Editor;
  getEditorMetaData: (htmlContent: string) => TCustomComponentsMetaData;
};

export const MarkdownClipboardPlugin = (args: TArgs): Plugin => {
  const { editor, getEditorMetaData } = args;

  return new Plugin({
    key: new PluginKey("markdownClipboard"),
    props: {
      handleDOMEvents: {
        copy: (view, event) => {
          try {
            event.preventDefault();
            event.clipboardData?.clearData();
            // editor meta data
            const editorHTML = editor.getHTML();
            const metaData = getEditorMetaData(editorHTML);
            // meta data from selection
            const clipboardHTML = view.serializeForClipboard(view.state.selection.content()).dom.innerHTML;
            // convert to markdown
            const markdown = convertHTMLToMarkdown({
              description_html: clipboardHTML,
              metaData,
            });
            event.clipboardData?.setData("text/plain", markdown);
            event.clipboardData?.setData("text/html", clipboardHTML);
            event.clipboardData?.setData("text/plane-editor-html", clipboardHTML);
            return true;
          } catch (error) {
            console.error("Failed to copy markdown content to clipboard:", error);
            return false;
          }
        },
      },
    },
  });
};
