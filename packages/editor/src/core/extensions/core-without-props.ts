import { Extension, Mark, Node } from "@tiptap/core";
import TextStyle from "@tiptap/extension-text-style";
import TiptapUnderline from "@tiptap/extension-underline";
// extensions
import { CustomCodeBlockExtensionWithoutProps } from "./code/without-props";
import { CustomCodeInlineExtension } from "./code-inline";
import { CustomColorExtension } from "./custom-color";
import { CustomLinkExtension } from "./custom-link";
import { CustomHorizontalRule } from "./horizontal-rule";
import { CustomImageComponentWithoutProps } from "./image/image-component-without-props";
import { ImageExtensionWithoutProps } from "./image";
import { IssueWidgetWithoutProps } from "./issue-embed/issue-embed-without-props";
import { CustomMentionWithoutProps } from "./mentions/mentions-without-props";
import { CustomQuoteExtension } from "./quote";
import { CustomStarterKit } from "./starter-kit";
import { CustomTableExtension } from "./table";
import { CustomTodoListExtension } from "./todo-list";

export const CoreEditorExtensionsWithoutProps: (Extension<any, any> | Node<any, any> | Mark<any, any>)[] = [
  CustomStarterKit,
  CustomQuoteExtension,
  CustomHorizontalRule,
  CustomLinkExtension,
  ImageExtensionWithoutProps().configure({
    HTMLAttributes: {
      class: "rounded-md",
    },
  }),
  CustomImageComponentWithoutProps(),
  TiptapUnderline,
  TextStyle,
  ...CustomTodoListExtension(),
  CustomCodeInlineExtension,
  CustomCodeBlockExtensionWithoutProps,
  ...CustomTableExtension,
  CustomMentionWithoutProps(),
  CustomColorExtension,
];

export const DocumentEditorExtensionsWithoutProps = [IssueWidgetWithoutProps()];
