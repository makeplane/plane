import { Extensions } from "@tiptap/core";
import { CustomAttachmentExtensionConfig } from "../attachments/extension-config";
import { MathematicsExtensionConfig } from "../mathematics/extension-config";
import { PageEmbedExtensionConfig } from "../page-embed/extension-config";

export const CoreEditorAdditionalExtensionsWithoutProps: Extensions = [
  CustomAttachmentExtensionConfig,
  MathematicsExtensionConfig,
];

export const DocumentEditorAdditionalExtensionsWithoutProps: Extensions = [PageEmbedExtensionConfig];
