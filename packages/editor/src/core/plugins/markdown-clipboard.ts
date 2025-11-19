import { Plugin, PluginKey } from "@tiptap/pm/state";
// plane imports
import { convertHTMLToMarkdown } from "@plane/utils";

export const MarkdownClipboardPlugin = (): Plugin =>
  new Plugin({
    key: new PluginKey("markdownClipboard"),
    props: {
      handleDOMEvents: {
        copy: (view, event) => {
          event.preventDefault();
          event.clipboardData?.clearData();
          const clipboardHTML = view.serializeForClipboard(view.state.selection.content()).dom.innerHTML;
          const markdown = convertHTMLToMarkdown({
            description_html: clipboardHTML,
            metaData: {
              file_assets: [],
              work_item_embeds: [],
              user_mentions: [],
              page_embeds: [],
            },
            name: "",
            workspaceSlug: "",
          });
          event.clipboardData?.setData("text/plain", markdown);
          event.clipboardData?.setData("text/html", clipboardHTML);
          return true;
        },
      },
    },
  });
