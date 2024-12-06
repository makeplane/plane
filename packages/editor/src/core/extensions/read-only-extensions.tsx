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
  CustomMention,
  HeadingListExtension,
  CustomReadOnlyImageExtension,
  CustomTextAlignExtension,
  CustomCalloutReadOnlyExtension,
  CustomColorExtension,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
// types
import { IMentionHighlight, TExtensions, TFileHandler } from "@/types";
// plane editor extensions
import { CoreReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions";

type Props = {
  disabledExtensions: TExtensions[];
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  mentionConfig: {
    mentionHighlights?: () => Promise<IMentionHighlight[]>;
  };
};

export const CoreReadOnlyEditorExtensions = (props: Props): Extensions => {
  const { disabledExtensions, fileHandler, mentionConfig } = props;

  return [
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
    ReadOnlyImageExtension({
      getAssetSrc: fileHandler.getAssetSrc,
    }).configure({
      HTMLAttributes: {
        class: "rounded-md",
      },
    }),
    CustomReadOnlyImageExtension({
      getAssetSrc: fileHandler.getAssetSrc,
    }),
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
    CustomMention({
      mentionHighlights: mentionConfig.mentionHighlights,
      readonly: true,
    }),
    CharacterCount,
    CustomColorExtension,
    HeadingListExtension,
    CustomTextAlignExtension,
    CustomCalloutReadOnlyExtension,
    ...CoreReadOnlyEditorAdditionalExtensions({
      disabledExtensions,
    }),
  ];
};
