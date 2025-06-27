import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// plane editor imports
import { CoreEditorAdditionalExtensionsWithoutProps } from "@/plane-editor/extensions/core/without-props";
// extensions
import { CustomCalloutExtensionConfig } from "./callout/extension-config";
import { CustomCodeBlockExtensionWithoutProps } from "./code/without-props";
import { CustomCodeInlineExtension } from "./code-inline";
import { CustomColorExtension } from "./custom-color";
import { CustomImageExtensionConfig } from "./custom-image/extension-config";
import { CustomLinkExtension } from "./custom-link";
import { EmojiExtension } from "./emoji/extension";
import { CustomHorizontalRule } from "./horizontal-rule";
import { ImageExtensionConfig } from "./image";
import { CustomMentionExtensionConfig } from "./mentions/extension-config";
import { CustomQuoteExtension } from "./quote";
import { TableHeader, TableCell, TableRow, Table } from "./table";
import { CustomTextAlignExtension } from "./text-align";
import { WorkItemEmbedExtensionConfig } from "./work-item-embed/extension-config";

export const CoreEditorExtensionsWithoutProps = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-[--list-spacing-y]",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-[--list-spacing-y]",
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
  }),
  EmojiExtension,
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
    validate: (url: string) => isValidHttpUrl(url).isValid,
    HTMLAttributes: {
      class:
        "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer",
    },
  }),
  ImageExtensionConfig,
  CustomImageExtensionConfig,
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
  CustomMentionExtensionConfig,
  CustomTextAlignExtension,
  CustomCalloutExtensionConfig,
  CustomColorExtension,
  ...CoreEditorAdditionalExtensionsWithoutProps,
];

export const DocumentEditorExtensionsWithoutProps = [WorkItemEmbedExtensionConfig];
