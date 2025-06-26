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
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  TableHeader,
  TableCell,
  TableRow,
  Table,
  CustomMentionExtension,
  CustomTextAlignExtension,
  CustomCalloutReadOnlyExtension,
  CustomColorExtension,
  UtilityExtension,
  ImageExtension,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// plane editor extensions
import { CoreReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import type { IReadOnlyEditorProps } from "@/types";
// local imports
import { CustomImageExtension } from "./custom-image/extension";

type Props = Pick<IReadOnlyEditorProps, "disabledExtensions" | "flaggedExtensions" | "fileHandler" | "mentionHandler">;

export const CoreReadOnlyEditorExtensions = (props: Props): Extensions => {
  const { disabledExtensions, fileHandler, flaggedExtensions, mentionHandler } = props;

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
      validate: (url: string) => isValidHttpUrl(url).isValid,
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
      transformCopiedText: false,
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
    UtilityExtension({
      disabledExtensions,
      fileHandler,
      isEditable: false,
    }),
    ...CoreReadOnlyEditorAdditionalExtensions({
      disabledExtensions,
      flaggedExtensions,
    }),
  ];

  if (!disabledExtensions.includes("image")) {
    extensions.push(
      ImageExtension({
        fileHandler,
      }),
      CustomImageExtension({
        fileHandler,
        isEditable: false,
      })
    );
  }

  return extensions;
};
