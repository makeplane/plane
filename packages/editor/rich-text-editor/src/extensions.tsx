import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { TableRow } from "@tiptap/extension-table-row";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { InputRule } from "@tiptap/core";

import ts from "highlight.js/lib/languages/typescript";
import { lowlight } from "lowlight/lib/core";
import "highlight.js/styles/github-dark.css";
import { Table } from "./table/table";
import { TableHeader } from "./table/table-header";
import { CustomTableCell } from "./table/table-cell";
import SlashCommand from "./slash-command";
import { UploadImage } from "./types/upload-image";

lowlight.registerLanguage("ts", ts);

export const TiptapExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) => [
    CodeBlockLowlight.configure({
      lowlight,
    }),
    HorizontalRule.extend({
      addInputRules() {
        return [
          new InputRule({
            find: /^(?:---|—-|___\s|\*\*\*\s)$/,
            handler: ({ state, range, commands }) => {
              commands.splitBlock();

              const attributes = {};
              const { tr } = state;
              const start = range.from;
              const end = range.to;
              // @ts-ignore
              tr.replaceWith(start - 1, end, this.type.create(attributes));
            },
          }),
        ];
      },
    }).configure({
      HTMLAttributes: {
        class: "mb-6 border-t border-custom-border-300",
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return `Heading ${node.attrs.level}`;
        }
        if (node.type.name === "image" || node.type.name === "table") {
          return "";
        }

        return "Press '/' for commands...";
      },
      includeChildren: true,
    }),
    SlashCommand(uploadFile, setIsSubmitting),
    Table,
    TableHeader,
    CustomTableCell,
    TableRow,
  ];
