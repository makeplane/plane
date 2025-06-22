import { Extensions } from "@tiptap/core";
// import BulletList from "@tiptap/extension-bullet-list";
import CharacterCount from "@tiptap/extension-character-count";
// import ListItem from "@tiptap/extension-list-item";
// import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
// import TaskItem from "@tiptap/extension-task-item";
// import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import {
  CustomCalloutExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomImageExtension,
  CustomKeymap,
  CustomLinkExtension,
  CustomMentionExtension,
  CustomQuoteExtension,
  CustomTextAlignExtension,
  CustomTypographyExtension,
  ImageExtension,
  ListKeymap,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  FlatListExtension,
  UtilityExtension,
} from "@/extensions";
// helpers
import { isValidHttpUrl } from "@/helpers/common";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// plane editor extensions
import { CoreEditorAdditionalExtensions } from "@/plane-editor/extensions";
import { IEditorProps } from "@/types";
// types
import { DropCursorExtension } from "./drop-cursor";

type TArguments = Pick<
  IEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "fileHandler" | "mentionHandler" | "placeholder" | "tabIndex"
> & {
  enableHistory: boolean;
  editable: boolean;
};

export const CoreEditorExtensions = (args: TArguments): Extensions => {
  const {
    disabledExtensions,
    enableHistory,
    fileHandler,
    flaggedExtensions,
    mentionHandler,
    placeholder,
    tabIndex,
    editable,
  } = args;

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
      // dropcursor: {
      //   class: "text-custom-text-300",
      // },
      dropcursor: false,
      ...(enableHistory ? {} : { history: false }),
    }),
    DropCursorExtension,
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
    CustomKeymap,
    ListKeymap({ tabIndex }),
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

        if (node.type.name === CORE_EXTENSIONS.HEADING) return `Heading ${node.attrs.level}`;

        const isUploadInProgress = getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY)?.uploadInProgress;

        if (isUploadInProgress) return "";

        const shouldHidePlaceholder =
          editor.isActive(CORE_EXTENSIONS.TABLE) ||
          editor.isActive(CORE_EXTENSIONS.CODE_BLOCK) ||
          editor.isActive(CORE_EXTENSIONS.IMAGE) ||
          editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE);

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
    UtilityExtension({
      disabledExtensions,
      fileHandler,
      isEditable: editable,
    }),
    CustomColorExtension,
    ...CoreEditorAdditionalExtensions({
      disabledExtensions,
      flaggedExtensions,
      fileHandler,
    }),
  ];

  if (!disabledExtensions.includes("image")) {
    extensions.push(
      ImageExtension(fileHandler).configure({
        HTMLAttributes: {
          class: "rounded-md",
        },
      }),
      CustomImageExtension(fileHandler)
    );
  }

  // @ts-expect-error - TODO: fix this
  return extensions;
};
