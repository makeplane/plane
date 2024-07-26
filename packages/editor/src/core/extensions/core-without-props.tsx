import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomCodeMarkPlugin,
  CustomHorizontalRule,
  CustomKeymap,
  CustomLinkExtension,
  CustomMentionWithoutProps,
  CustomQuoteExtension,
  CustomTypographyExtension,
  ImageExtensionWithoutProps,
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";

export const CoreEditorExtensionsWithoutProps = () => [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-2",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-2",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "not-prose space-y-2",
      },
    },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    blockquote: false,
    dropcursor: false,
  }),
  CustomQuoteExtension,
  CustomHorizontalRule.configure({
    HTMLAttributes: {
      class: "my-4 border-custom-border-400",
    },
  }),
  CustomKeymap,
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
  ImageExtensionWithoutProps().configure({
    HTMLAttributes: {
      class: "rounded-md",
    },
  }),
  TiptapUnderline,
  TextStyle,
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2 space-y-2",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex",
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
  }),
  Table,
  TableHeader,
  TableCell,
  TableRow,
  CustomMentionWithoutProps(),
];
