import { Extensions } from "@tiptap/core";
import { CustomAttachmentExtensionConfig } from "../attachments/extension-config";
import { ExternalEmbedExtensionConfig } from "../external-embed/extension-config";
import { MathematicsExtensionConfig } from "../mathematics/extension-config";
import { PageEmbedExtensionConfig } from "../page-embed/extension-config";

export const CoreEditorAdditionalExtensionsWithoutProps: Extensions = [
  ExternalEmbedExtensionConfig,
  CustomAttachmentExtensionConfig,
  MathematicsExtensionConfig,
];

export const DocumentEditorAdditionalExtensionsWithoutProps: Extensions = [PageEmbedExtensionConfig];
