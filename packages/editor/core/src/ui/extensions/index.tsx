import { Color } from "@tiptap/extension-color";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

import { Table } from "src/ui/extensions/table/table";
import { TableCell } from "src/ui/extensions/table/table-cell/table-cell";
import { TableHeader } from "src/ui/extensions/table/table-header/table-header";
import { TableRow } from "src/ui/extensions/table/table-row/table-row";

import { ImageExtension } from "src/ui/extensions/image";

import { isValidHttpUrl } from "src/lib/utils";
import { Mentions } from "src/ui/mentions";

import { CustomCodeBlockExtension } from "src/ui/extensions/code";
import { ListKeymap } from "src/ui/extensions/custom-list-keymap";
import { CustomKeymap } from "src/ui/extensions/keymap";
import { CustomQuoteExtension } from "src/ui/extensions/quote";

import { DeleteImage } from "src/types/delete-image";
import { IMentionSuggestion } from "src/types/mention-suggestion";
import { RestoreImage } from "src/types/restore-image";
import { CustomLinkExtension } from "src/ui/extensions/custom-link";
import { CustomCodeInlineExtension } from "./code-inline";

export const CoreEditorExtensions = (
  mentionConfig: {
    mentionSuggestions: IMentionSuggestion[];
    mentionHighlights: string[];
  },
  deleteFile: DeleteImage,
  restoreFile: RestoreImage,
  cancelUploadImage?: () => any
) => [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2",
      },
    },
    code: false,
    codeBlock: false,
    horizontalRule: {
      HTMLAttributes: { class: "mt-4 mb-4" },
    },
    blockquote: false,
    dropcursor: {
      color: "rgba(var(--color-text-100))",
      width: 2,
    },
  }),
  CustomQuoteExtension.configure({
    HTMLAttributes: { className: "border-l-4 border-custom-border-300" },
  }),
  CustomKeymap,
  ListKeymap,
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
  ImageExtension(deleteFile, restoreFile, cancelUploadImage).configure({
    HTMLAttributes: {
      class: "rounded-lg border border-custom-border-300",
    },
  }),
  TiptapUnderline,
  TextStyle,
  Color,
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4",
    },
    nested: true,
  }),
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  Markdown.configure({
    html: true,
    transformCopiedText: true,
    transformPastedText: true,
  }),
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Mentions(mentionConfig.mentionSuggestions, mentionConfig.mentionHighlights, false),
];
