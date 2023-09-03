import StarterKit from "@tiptap/starter-kit";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "tiptap-markdown";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/core";
import SlashCommand from "../slash-command";
import { InputRule } from "@tiptap/core";

import ts from "highlight.js/lib/languages/typescript";

import "highlight.js/styles/github-dark.css";
import UniqueID from "@tiptap-pro/extension-unique-id";
import UpdatedImage from "./updated-image";
import isValidHttpUrl from "../bubble-menu/utils/link-validator";

lowlight.registerLanguage("ts", ts);

export const TiptapExtensions = (
  workspaceSlug: string,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
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
    code: {
      HTMLAttributes: {
        class: "rounded-md bg-custom-primary-30 mx-1 px-1 py-1 font-mono font-medium text-custom-text-1000",
        spellcheck: "false",
      },
    },
    codeBlock: false,
    horizontalRule: false,
    dropcursor: {
      color: "#DBEAFE",
      width: 2,
    },
    gapcursor: false,
  }),
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
  TiptapLink.configure({
    protocols: ["http", "https"],
    validate: (url) => isValidHttpUrl(url),
    HTMLAttributes: {
      class:
        "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer",
    },
  }),
  UpdatedImage.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-custom-border-300",
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  }),
  UniqueID.configure({
    types: ["image"],
  }),
  SlashCommand(workspaceSlug, setIsSubmitting),
  TiptapUnderline,
  TextStyle,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
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
];
