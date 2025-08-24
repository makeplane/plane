import { Extensions } from "@tiptap/core";
import CharacterCount from "@tiptap/extension-character-count";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCalloutExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomKeymap,
  CustomLinkExtension,
  CustomMentionExtension,
  CustomQuoteExtension,
  CustomTextAlignExtension,
  CustomTypographyExtension,
  ImageExtension,
  ListKeymap,
  SmoothCursorExtension,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  UtilityExtension,
} from "@/extensions";
// plane editor extensions
import { CoreEditorAdditionalExtensions } from "@/plane-editor/extensions";
import type { IEditorPropsExtended } from "@/plane-editor/types/editor-extended";
// types
import type { IEditorProps } from "@/types";
// local imports
import { CustomImageExtension } from "./custom-image/extension";
import { EmojiExtension } from "./emoji/extension";
import { CustomPlaceholderExtension } from "./placeholder";
import { CustomStarterKitExtension } from "./starter-kit";

type TArguments = Pick<
  IEditorProps,
  | "disabledExtensions"
  | "flaggedExtensions"
  | "fileHandler"
  | "isTouchDevice"
  | "mentionHandler"
  | "placeholder"
  | "tabIndex"
> & {
  enableHistory: boolean;
  editable: boolean;
} & Pick<IEditorPropsExtended, "extensionOptions" | "isSmoothCursorEnabled">;

export const CoreEditorExtensions = (args: TArguments): Extensions => {
  const {
    disabledExtensions,
    enableHistory,
    fileHandler,
    flaggedExtensions,
    isTouchDevice = false,
    mentionHandler,
    placeholder,
    tabIndex,
    editable,
    // additional props
    extensionOptions,
    isSmoothCursorEnabled,
  } = args;

  const extensions = [
    CustomStarterKitExtension({
      enableHistory,
    }),
    EmojiExtension,
    CustomQuoteExtension,
    CustomHorizontalRule,
    CustomKeymap,
    ListKeymap({ tabIndex }),
    CustomLinkExtension,
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
        class: "relative",
      },
      nested: true,
    }),
    CustomCodeBlockExtension,
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
    CustomPlaceholderExtension({ placeholder }),
    CharacterCount,
    CustomColorExtension,
    CustomTextAlignExtension,
    CustomCalloutExtension,
    UtilityExtension({
      disabledExtensions,
      fileHandler,
      isEditable: editable,
      isTouchDevice,
    }),
    ...CoreEditorAdditionalExtensions({
      disabledExtensions,
      flaggedExtensions,
      fileHandler,
      // additional props
      extensionOptions,
    }),
  ];

  if (isSmoothCursorEnabled) {
    extensions.push(SmoothCursorExtension);
  }

  if (!disabledExtensions.includes("image")) {
    extensions.push(
      ImageExtension({
        fileHandler,
      }),
      CustomImageExtension({
        fileHandler,
        isEditable: editable,
      })
    );
  }

  return extensions;
};
