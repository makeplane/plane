import StarterKit from "@tiptap/starter-kit";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "tiptap-markdown";

import { TableHeader } from "src/ui/extensions/table/table-header/table-header";
import { Table } from "src/ui/extensions/table/table";
import { TableCell } from "src/ui/extensions/table/table-cell/table-cell";
import { TableRow } from "src/ui/extensions/table/table-row/table-row";

import { ReadOnlyImageExtension } from "src/ui/extensions/image/read-only-image";
import { isValidHttpUrl } from "src/lib/utils";
import { Mentions } from "src/ui/mentions";
import { IMentionHighlight } from "src/types/mention-suggestion";
import { CustomLinkExtension } from "src/ui/extensions/custom-link";
import { CustomHorizontalRule } from "src/ui/extensions/horizontal-rule/horizontal-rule";
import { CustomQuoteExtension } from "src/ui/extensions/quote";
import { CustomTypographyExtension } from "src/ui/extensions/typography";
import { CustomCodeBlockExtension } from "src/ui/extensions/code";
import { CustomCodeInlineExtension } from "src/ui/extensions/code-inline";

export const CoreReadOnlyEditorExtensions = (mentionConfig: {
  mentionHighlights?: () => Promise<IMentionHighlight[]>;
}) => [
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
    gapcursor: false,
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
  CustomTypographyExtension,
  ReadOnlyImageExtension.configure({
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
      class: "relative pointer-events-none",
    },
    nested: true,
  }),
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
  Mentions({
    mentionHighlights: mentionConfig.mentionHighlights,
    readonly: true,
  }),
];
