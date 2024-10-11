import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
// extensions
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { CustomCodeBlockExtensionWithoutProps } from "./code/without-props";
import { CustomCodeInlineExtension } from "./code-inline";
import { CustomLinkExtension } from "./custom-link";
import { CustomHorizontalRule } from "./horizontal-rule";
import { ImageExtensionWithoutProps } from "./image";
import { CustomImageComponentWithoutProps } from "./image/image-component-without-props";
import { IssueWidgetWithoutProps } from "./issue-embed/issue-embed-without-props";
import { CustomMentionWithoutProps } from "./mentions/mentions-without-props";
import { CustomQuoteExtension } from "./quote";
import { TableHeader, TableCell, TableRow, Table } from "./table";

export const CoreEditorExtensionsWithoutProps = [
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
  ImageExtensionWithoutProps().configure({
    HTMLAttributes: {
      class: "rounded-md",
    },
  }),
  CustomImageComponentWithoutProps(),
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
  CustomCodeInlineExtension,
  CustomCodeBlockExtensionWithoutProps,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  CustomMentionWithoutProps(),
];

export const DocumentEditorExtensionsWithoutProps = [IssueWidgetWithoutProps()];
