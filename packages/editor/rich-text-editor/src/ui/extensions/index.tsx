import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from 'lowlight'
import { InputRule } from "@tiptap/core";

import ts from "highlight.js/lib/languages/typescript";

import SlashCommand from "./slash-command";
import { UploadImage } from "../";

const lowlight = createLowlight(common)
lowlight.register("ts", ts);

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) => [
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
    SlashCommand(uploadFile, setIsSubmitting),
    CodeBlockLowlight.configure({
      lowlight,
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
  ];
