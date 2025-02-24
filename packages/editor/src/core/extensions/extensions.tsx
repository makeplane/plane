import { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCalloutExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomCodeMarkPlugin,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomImageExtension,
  CustomKeymap,
  CustomLinkExtension,
  CustomMentionExtension,
  CustomQuoteExtension,
  CustomTextAlignExtension,
  CustomTypographyExtension,
  DropHandlerExtension,
  ImageExtension,
  ListKeymap,
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// plane editor extensions
import { CoreEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TExtensions, TFileHandler, TMentionHandler } from "@/types";

type TArguments = {
  disabledExtensions: TExtensions[];
  enableHistory: boolean;
  fileHandler: TFileHandler;
  mentionHandler: TMentionHandler;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  editable: boolean;
};

export const CoreEditorExtensions = (args: TArguments): Extensions => {
  const { disabledExtensions, enableHistory, fileHandler, mentionHandler, placeholder, tabIndex } = args;

  return [
    // @ts-expect-error tiptap types are incorrect
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
      dropcursor: {
        class:
          "text-custom-text-300 transition-all motion-reduce:transition-none motion-reduce:hover:transform-none duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)]",
      },
      ...(enableHistory ? {} : { history: false }),
    }),
    CustomQuoteExtension,
    DropHandlerExtension,
    CustomHorizontalRule.configure({
      HTMLAttributes: {
        class: "py-4 border-custom-border-400",
      },
    }),
    CustomKeymap,
    ListKeymap({ tabIndex }),
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
    ImageExtension(fileHandler).configure({
      HTMLAttributes: {
        class: "rounded-md",
      },
    }),
    CustomImageExtension(fileHandler),
    TiptapUnderline,
    TextStyle,
    TaskList.configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "relative",
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
      transformCopiedText: true,
      transformPastedText: true,
      breaks: true,
    }),
    Table,
    TableHeader,
    TableCell,
    TableRow,
    CustomMentionExtension(mentionHandler),
    Placeholder.configure({
      placeholder: ({ editor, node }) => {
        if (!editor.isEditable) return "";

        if (node.type.name === "heading") return `Heading ${node.attrs.level}`;

        if (editor.storage.imageComponent.uploadInProgress) return "";

        const shouldHidePlaceholder =
          editor.isActive("table") ||
          editor.isActive("codeBlock") ||
          editor.isActive("image") ||
          editor.isActive("imageComponent");

        if (shouldHidePlaceholder) return "";

        if (placeholder) {
          if (typeof placeholder === "string") return placeholder;
          else return placeholder(editor.isFocused, editor.getHTML());
        }

        return "Press '/' for commands...";
      },
      includeChildren: true,
    }),
    CharacterCount,
    CustomTextAlignExtension,
    CustomCalloutExtension,
    CustomColorExtension,
    ...CoreEditorAdditionalExtensions({
      disabledExtensions,
    }),
  ];
};
