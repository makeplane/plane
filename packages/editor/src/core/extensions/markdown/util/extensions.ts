import { AnyExtension } from "@tiptap/core";
import markdownExtensions from "../extensions";

export function getMarkdownSpec(extension: AnyExtension) {
  const markdownSpec = extension.storage?.markdown;
  const defaultMarkdownSpec = markdownExtensions.find((e) => e.name === extension.name)?.storage.markdown;

  if (markdownSpec || defaultMarkdownSpec) {
    return {
      ...defaultMarkdownSpec,
      ...markdownSpec,
    };
  }

  return null;
}
