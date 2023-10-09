import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "tiptap-markdown";
import Gapcursor from "@tiptap/extension-gapcursor";

import { CustomTableCell } from "../extensions/table/table-cell";
import { Table } from "../extensions/table";
import { TableHeader } from "../extensions/table/table-header";
import { TableRow } from "@tiptap/extension-table-row";

import ReadOnlyImageExtension from "../extensions/image/read-only-image";
import { isValidHttpUrl } from "../../lib/utils";

export const CoreReadOnlyEditorExtensions  = [
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
    code: {
      HTMLAttributes: {
        class:
          "rounded-md bg-custom-primary-30 mx-1 px-1 py-1 font-mono font-medium text-custom-text-1000",
        spellcheck: "false",
      },
    },
    codeBlock: false,
    horizontalRule: false,
    dropcursor: {
      color: "rgba(var(--color-text-100))",
      width: 2,
    },
    gapcursor: false,
  }),
    Gapcursor,
    TiptapLink.configure({
      protocols: ["http", "https"],
      validate: (url) => isValidHttpUrl(url),
      HTMLAttributes: {
        class:
          "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer",
      },
    }),
    ReadOnlyImageExtension.configure({
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
    Markdown.configure({
      html: true,
      transformCopiedText: true,
    }),
    Table,
    TableHeader,
    CustomTableCell,
    TableRow,
  ];
