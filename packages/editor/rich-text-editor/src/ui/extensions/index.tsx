import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/core";
import { InputRule } from "@tiptap/core";

import ts from "highlight.js/lib/languages/typescript";

import "highlight.js/styles/github-dark.css";
import SlashCommand from "./slash-command";
import { UploadImage } from "..";

lowlight.registerLanguage("ts", ts);

export const RichTextEditorExtensions = (
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) => [
    SlashCommand(uploadFile, setIsSubmitting),
  ];
