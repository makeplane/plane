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
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomCodeMarkPlugin,
  CustomHorizontalRule,
  CustomImageExtension,
  CustomKeymap,
  CustomLinkExtension,
  CustomMention,
  CustomQuoteExtension,
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
// types
import { DeleteImage, IMentionHighlight, IMentionSuggestion, RestoreImage, UploadImage } from "@/types";

type TArguments = {
  enableHistory: boolean;
  fileConfig: {
    deleteFile: DeleteImage;
    restoreFile: RestoreImage;
    cancelUploadImage?: () => void;
    uploadFile: UploadImage;
  };
  mentionConfig: {
    mentionSuggestions?: () => Promise<IMentionSuggestion[]>;
    mentionHighlights?: () => Promise<IMentionHighlight[]>;
  };
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

export const CoreEditorExtensions = ({
  enableHistory,
  fileConfig: { deleteFile, restoreFile, cancelUploadImage, uploadFile },
  mentionConfig,
  placeholder,
  tabIndex,
}: TArguments) => [
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
    dropcursor: {
      class: "text-custom-text-300",
    },
    ...(enableHistory ? {} : { history: false }),
  }),
  CustomQuoteExtension,
  DropHandlerExtension(),
  CustomHorizontalRule.configure({
    HTMLAttributes: {
      class: "my-4 border-custom-border-400",
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
  ImageExtension(deleteFile, restoreFile, cancelUploadImage).configure({
    HTMLAttributes: {
      class: "rounded-md",
    },
  }),
  CustomImageExtension({
    delete: deleteFile,
    restore: restoreFile,
    upload: uploadFile,
    cancel: cancelUploadImage ?? (() => {}),
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
    transformPastedText: true,
    breaks: true,
  }),
  Table,
  TableHeader,
  TableCell,
  TableRow,
  CustomMention({
    mentionSuggestions: mentionConfig.mentionSuggestions,
    mentionHighlights: mentionConfig.mentionHighlights,
    readonly: false,
  }),
  Placeholder.configure({
    placeholder: ({ editor, node }) => {
      if (node.type.name === "heading") return `Heading ${node.attrs.level}`;

      if (editor.storage.imageComponent.uploadInProgress) return "";

      const shouldHidePlaceholder =
        editor.isActive("table") || editor.isActive("codeBlock") || editor.isActive("image");

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
];
