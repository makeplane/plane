import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "tiptap-markdown";

import TableHeader from "./table/table-header/table-header";
import Table from "./table/table";
import TableCell from "./table/table-cell/table-cell";
import TableRow from "./table/table-row/table-row";
import HorizontalRule from "./horizontal-rule";

import ImageExtension from "./image";

import { isValidHttpUrl } from "../../lib/utils";
import { Mentions } from "../mentions";

import { CustomKeymap } from "./keymap";
import { CustomCodeBlock } from "./code";
import { ListKeymap } from "./custom-list-keymap";
import {
  IMentionSuggestion,
  DeleteImage,
  RestoreImage,
} from "@plane/editor-types";

export const CoreEditorExtensions = (
  mentionConfig: {
    mentionSuggestions: IMentionSuggestion[];
    mentionHighlights: string[];
  },
  deleteFile: DeleteImage,
  restoreFile: RestoreImage,
  cancelUploadImage?: () => any,
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
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-custom-border-300",
      },
    },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    dropcursor: {
      color: "rgba(var(--color-text-100))",
      width: 2,
    },
  }),
  CustomKeymap,
  ListKeymap,
  TiptapLink.configure({
    protocols: ["http", "https"],
    validate: (url) => isValidHttpUrl(url),
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
  CustomCodeBlock,
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4",
    },
    nested: true,
  }),
  Markdown.configure({
    html: true,
    transformCopiedText: true,
    transformPastedText: true,
  }),
  HorizontalRule,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  Mentions(
    mentionConfig.mentionSuggestions,
    mentionConfig.mentionHighlights,
    false,
  ),
];
