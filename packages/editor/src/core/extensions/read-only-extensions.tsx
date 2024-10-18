import { Extension, Mark, Node } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomQuoteExtension,
  CustomHorizontalRule,
  CustomLinkExtension,
  CustomTypographyExtension,
  ReadOnlyImageExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  TableHeader,
  TableCell,
  TableRow,
  Table,
  CustomMention,
  HeadingListExtension,
  CustomReadOnlyImageExtension,
  CustomColorExtension,
  CustomStarterKit,
  CustomTodoListExtension,
} from "@/extensions";
// types
import { IMentionHighlight, TFileHandler } from "@/types";

type Props = {
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  mentionConfig: {
    mentionHighlights?: () => Promise<IMentionHighlight[]>;
  };
};

export const CoreReadOnlyEditorExtensions = (
  props: Props
): (Extension<any, any> | Node<any, any> | Mark<any, any>)[] => {
  const { fileHandler, mentionConfig } = props;

  return [
    CustomStarterKit.configure({
      gapcursor: false,
    }),
    CustomQuoteExtension,
    CustomHorizontalRule,
    CustomLinkExtension,
    CustomTypographyExtension,
    ReadOnlyImageExtension({
      getAssetSrc: fileHandler.getAssetSrc,
    }).configure({
      HTMLAttributes: {
        class: "rounded-md",
      },
    }),
    CustomReadOnlyImageExtension({
      getAssetSrc: fileHandler.getAssetSrc,
    }),
    TiptapUnderline,
    TextStyle,
    ...CustomTodoListExtension({
      readOnly: true,
    }),
    CustomCodeBlockExtension,
    CustomCodeInlineExtension,
    Markdown.configure({
      html: true,
      transformCopiedText: true,
    }),
    Table,
    TableHeader,
    TableCell,
    TableRow,
    CustomMention({
      mentionHighlights: mentionConfig.mentionHighlights,
      readOnly: true,
    }),
    CharacterCount,
    CustomColorExtension,
    HeadingListExtension,
  ];
};
