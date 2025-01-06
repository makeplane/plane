import { Extensions } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
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
  CustomMentionExtension,
  CustomReadOnlyImageExtension,
  CustomTextAlignExtension,
  CustomCalloutReadOnlyExtension,
  CustomColorExtension,
  FlatListExtension,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// plane editor extensions
import { CoreReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TExtensions, TFileHandler, TReadOnlyMentionHandler } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  mentionHandler: TReadOnlyMentionHandler;
};

export const CoreReadOnlyEditorExtensions = (props: Props): Extensions => {
  const { disabledExtensions, fileHandler, mentionHandler } = props;

  return [
    StarterKit.configure({
      bulletList: false,
      orderedList: false,
      listItem: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      blockquote: false,
      paragraph: {
        HTMLAttributes: {
          class: "editor-paragraph-block",
        },
      },
      heading: {
        HTMLAttributes: {
          class: "editor-heading-block",
        },
      },
      dropcursor: false,
      gapcursor: false,
    }),
    FlatListExtension,
    BulletList.extend({
      parseHTML() {
        return [];
      },
      addInputRules() {
        return [];
      },
    }).configure({
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-2",
      },
    }),
    OrderedList.extend({
      parseHTML() {
        return [];
      },
      addInputRules() {
        return [];
      },
    }).configure({
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-2",
      },
    }),
    ListItem.extend({
      parseHTML() {
        return [];
      },
      addInputRules() {
        return [];
      },
    }).configure({
      HTMLAttributes: {
        class: "not-prose space-y-2",
      },
    }),
    TaskList.extend({
      parseHTML() {
        return [];
      },
      addInputRules() {
        return [];
      },
    }).configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.extend({
      parseHTML() {
        return [];
      },
      addInputRules() {
        return [];
      },
      addKeyboardShortcuts() {
        return {};
      },
    }).configure({
      HTMLAttributes: {
        class: "relative",
      },
      nested: true,
    }),
    CustomQuoteExtension,
    CustomHorizontalRule.configure({
      HTMLAttributes: {
        class: "py-4 border-custom-border-400",
      },
    }),
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
    CustomCodeBlockExtension.configure({
      HTMLAttributes: {
        class: "",
      },
    }),
    CustomCodeInlineExtension,
    Markdown.configure({
      html: true,
      transformCopiedText: true,
    }),
    Table,
    TableHeader,
    TableCell,
    TableRow,
    CustomMentionExtension(mentionHandler),
    CharacterCount,
    CustomColorExtension,
    CustomTextAlignExtension,
    CustomCalloutReadOnlyExtension,
    ...CoreReadOnlyEditorAdditionalExtensions({
      disabledExtensions,
    }),
  ];
};
