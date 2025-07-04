import { Extensions } from "@tiptap/core";
import { CustomAttachmentExtensionConfig } from "../attachments/extension-config";
import { PageEmbedExtensionConfig } from "../page-embed/extension-config";

export const CoreEditorAdditionalExtensionsWithoutProps: Extensions = [CustomAttachmentExtensionConfig];

export const DocumentEditorAdditionalExtensionsWithoutProps: Extensions = [PageEmbedExtensionConfig];
