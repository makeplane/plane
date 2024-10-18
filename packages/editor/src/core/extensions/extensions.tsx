import { Extension, Mark, Node } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomCodeMarkPlugin,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomImageExtension,
  CustomKeymap,
  CustomLinkExtension,
  CustomMention,
  CustomPlaceholderExtension,
  CustomQuoteExtension,
  CustomStarterKit,
  CustomTableExtension,
  CustomTodoListExtension,
  CustomTypographyExtension,
  DropHandlerExtension,
  ImageExtension,
  ListKeymap,
} from "@/extensions";
// types
import { IMentionHighlight, IMentionSuggestion, TFileHandler } from "@/types";

type TArguments = {
  enableHistory: boolean;
  fileHandler: TFileHandler;
  mentionConfig: {
    mentionSuggestions?: () => Promise<IMentionSuggestion[]>;
    mentionHighlights?: () => Promise<IMentionHighlight[]>;
  };
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

export const CoreEditorExtensions = (args: TArguments): (Extension<any, any> | Node<any, any> | Mark<any, any>)[] => {
  const { enableHistory, fileHandler, mentionConfig, placeholder, tabIndex } = args;

  return [
    CustomStarterKit.configure({
      ...(enableHistory ? {} : { history: false }),
    }),
    CustomQuoteExtension,
    DropHandlerExtension(),
    CustomHorizontalRule,
    CustomKeymap,
    ListKeymap({ tabIndex }),
    CustomLinkExtension,
    CustomTypographyExtension,
    ImageExtension(fileHandler).configure({
      HTMLAttributes: {
        class: "rounded-md",
      },
    }),
    CustomImageExtension(fileHandler),
    TiptapUnderline,
    TextStyle,
    ...CustomTodoListExtension(),
    CustomCodeBlockExtension,
    CustomCodeMarkPlugin,
    CustomCodeInlineExtension,
    Markdown.configure({
      html: true,
      transformPastedText: true,
      breaks: true,
    }),
    ...CustomTableExtension,
    CustomMention({
      mentionSuggestions: mentionConfig.mentionSuggestions,
      mentionHighlights: mentionConfig.mentionHighlights,
      readOnly: false,
    }),
    CustomPlaceholderExtension({
      placeholder,
    }),
    CharacterCount,
    CustomColorExtension,
  ];
};
