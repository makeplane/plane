import { Editor } from "@tiptap/core";

export const copyMarkdownToClipboard = (editor: Editor | null) => {
  const markdownOutput = editor?.storage.markdown.getMarkdown();
  navigator.clipboard.writeText(markdownOutput);
};

export const CopyPageLink = () => {
  if (window) {
    navigator.clipboard.writeText(window.location.toString());
  }
};
