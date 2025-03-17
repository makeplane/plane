import { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomQuoteExtension,
  CustomHorizontalRule,
  CustomLinkExtension,
  CustomTypographyExtension,
  ReadOnlyImageExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  TableHeader,
  TableCell,
  TableRow,
  Table,
  CustomMentionExtension,
  CustomReadOnlyImageExtension,
  CustomTextAlignExtension,
  CustomCalloutReadOnlyExtension,
  CustomColorExtension,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// plane editor extensions
import { CoreReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TExtensions, TReadOnlyFileHandler, TReadOnlyMentionHandler } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
  fileHandler: TReadOnlyFileHandler;
  mentionHandler: TReadOnlyMentionHandler;
};

export const CoreReadOnlyEditorExtensions = (props: Props): Extensions => {
  const { disabledExtensions, fileHandler, mentionHandler } = props;

  const extensions = [
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
      gapcursor: false,
    }),
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
      validate: (url: string) => isValidHttpUrl(url),
      HTMLAttributes: {
        class:
          "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer",
      },
    }),
    CustomTypographyExtension,
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
    CustomMentionExtension(mentionHandler),
    CharacterCount,
    CustomColorExtension,
    CustomTextAlignExtension,
    CustomCalloutReadOnlyExtension,
    ...CoreReadOnlyEditorAdditionalExtensions({
      disabledExtensions,
    }),
  ];

  if (!disabledExtensions.includes("image")) {
    extensions.push(
      ReadOnlyImageExtension(fileHandler).configure({
        HTMLAttributes: {
          class: "rounded-md",
        },
      }),
      CustomReadOnlyImageExtension(fileHandler)
    );
  }

  // @ts-expect-error tiptap types are incorrect
  return extensions;
};
