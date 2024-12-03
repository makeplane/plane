import { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCalloutExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomCodeMarkPlugin,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomImageExtension,
  CustomKeymap,
  CustomLinkExtension,
  CustomMention,
  CustomQuoteExtension,
  CustomTextAlignExtension,
  CustomTypographyExtension,
  DropHandlerExtension,
  ImageExtension,
  ListKeymap,
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// types
import { IMentionHighlight, IMentionSuggestion, TExtensions, TFileHandler } from "@/types";
// plane editor extensions
import { CoreEditorAdditionalExtensions } from "@/plane-editor/extensions";
import { FlatListExtension } from "./flat-list/list-extension";

type TArguments = {
  disabledExtensions: TExtensions[];
  enableHistory: boolean;
  fileHandler: TFileHandler;
  mentionConfig: {
    mentionSuggestions?: () => Promise<IMentionSuggestion[]>;
    mentionHighlights?: () => Promise<IMentionHighlight[]>;
  };
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

export const CoreEditorExtensions = (args: TArguments): Extensions => {
  const { disabledExtensions, enableHistory, fileHandler, mentionConfig, placeholder, tabIndex } = args;

  return [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      blockquote: false,
      dropcursor: {
        width: 2,
        class: "transition-all duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)] text-custom-text-300",
      },
      ...(enableHistory ? {} : { history: false }),
    }),
    BulletList.extend({
      addInputRules() {
        return [];
      },
      addKeyboardShortcuts() {
        return {};
      },
    }).configure({
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-2",
      },
    }),
    OrderedList.extend({
      addInputRules() {
        return [];
      },
      addKeyboardShortcuts() {
        return {};
      },
    }).configure({
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-2",
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: "not-prose space-y-2",
      },
    }),
    CustomQuoteExtension,
    DropHandlerExtension(),
    CustomHorizontalRule.configure({
      HTMLAttributes: {
        class: "py-4 border-custom-border-400",
      },
    }),
    CustomKeymap,
    ListKeymap({ tabIndex }),
    CustomLinkExtension.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      protocols: ["http", "https"],
      validate: (url: string) => isValidHttpUrl(url),
      HTMLAttributes: {
        class:
          "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer",
      },
    }),
    CustomTypographyExtension,
    ImageExtension(fileHandler).configure({
      HTMLAttributes: {
        class: "rounded-md",
      },
    }),
    CustomImageExtension(fileHandler),
    TiptapUnderline,
    TextStyle,
    TaskList.extend({
      addInputRules() {
        return [];
      },
      addKeyboardShortcuts() {
        return {};
      },
    }).configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "relative",
      },
      nested: true,
    }),
    CustomCodeBlockExtension.configure({
      HTMLAttributes: {
        class: "",
      },
    }),
    CustomCodeMarkPlugin,
    CustomCodeInlineExtension,
    Markdown.configure({
      html: true,
      transformPastedText: true,
      breaks: true,
    }),
    Table,
    TableHeader,
    TableCell,
    TableRow,
    CustomMention({
      mentionSuggestions: mentionConfig.mentionSuggestions,
      mentionHighlights: mentionConfig.mentionHighlights,
      readonly: false,
    }),
    Placeholder.configure({
      placeholder: ({ editor, node }) => {
        if (node.type.name === "heading") return `Heading ${node.attrs.level}`;

        if (editor.storage.imageComponent.uploadInProgress) return "";

        const shouldHidePlaceholder =
          editor.isActive("table") ||
          editor.isActive("codeBlock") ||
          editor.isActive("image") ||
          editor.isActive("imageComponent");

        if (shouldHidePlaceholder) return "";

        if (placeholder) {
          if (typeof placeholder === "string") return placeholder;
          else return placeholder(editor.isFocused, editor.getHTML());
        }

        return "Press '/' for commands...";
      },
      includeChildren: true,
    }),
    CharacterCount,
    CustomTextAlignExtension,
    CustomCalloutExtension,
    CustomColorExtension,
    ...CoreEditorAdditionalExtensions({
      disabledExtensions,
    }),
    FlatListExtension,
  ];
};
