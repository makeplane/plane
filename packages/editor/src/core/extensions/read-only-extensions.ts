import { Extensions } from "@tiptap/core";
// import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
// import ListItem from "@tiptap/extension-list-item";
// import OrderedList from "@tiptap/extension-ordered-list";
// import TaskItem from "@tiptap/extension-task-item";
// import TaskList from "@tiptap/extension-task-list";
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
  FlatListExtension,
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
      bulletList: false,
      orderedList: false,
      listItem: false,
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
    FlatListExtension,
    // BulletList.extend({
    //   parseHTML() {
    //     return [];
    //   },
    //   addInputRules() {
    //     return [];
    //   },
    // }).configure({
    //   HTMLAttributes: {
    //     class: "list-disc pl-7 space-y-2",
    //   },
    // }),
    // OrderedList.extend({
    //   parseHTML() {
    //     return [];
    //   },
    //   addInputRules() {
    //     return [];
    //   },
    // }).configure({
    //   HTMLAttributes: {
    //     class: "list-decimal pl-7 space-y-2",
    //   },
    // }),
    // ListItem.extend({
    //   parseHTML() {
    //     return [];
    //   },
    //   addInputRules() {
    //     return [];
    //   },
    // }).configure({
    //   HTMLAttributes: {
    //     class: "not-prose space-y-2",
    //   },
    // }),
    // TaskList.extend({
    //   parseHTML() {
    //     return [];
    //   },
    //   addInputRules() {
    //     return [];
    //   },
    // }).configure({
    //   HTMLAttributes: {
    //     class: "not-prose pl-2 space-y-2",
    //   },
    // }),
    // TaskItem.extend({
    //   parseHTML() {
    //     return [];
    //   },
    //   addInputRules() {
    //     return [];
    //   },
    //   addKeyboardShortcuts() {
    //     return {};
    //   },
    // }).configure({
    //   HTMLAttributes: {
    //     class: "relative",
    //   },
    //   nested: true,
    // }),
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
