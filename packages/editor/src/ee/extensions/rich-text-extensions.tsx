import { AnyExtension, Extensions } from "@tiptap/core";
import { Paperclip } from "lucide-react";
// root
import { SlashCommands, TSlashCommandAdditionalOption } from "@/extensions/slash-commands/root";
// types
import { TExtensions } from "@/types";
// core imports
import {
  TRichTextEditorAdditionalExtensionsProps,
  TRichTextEditorAdditionalExtensionsRegistry,
} from "src/ce/extensions/rich-text-extensions";
// local imports
import { insertAttachment } from "../helpers/editor-commands";
import { CustomAttachmentExtension } from "./attachments/extension";

/**
 * Registry for slash commands
 * Each entry defines a single slash command option with its own enabling logic
 */
const slashCommandRegistry: {
  isEnabled: (disabledExtensions: TExtensions[], flaggedExtensions: TExtensions[]) => boolean;
  getOption: (props: TRichTextEditorAdditionalExtensionsProps) => TSlashCommandAdditionalOption | null;
}[] = [
  {
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("attachments") && !flaggedExtensions.includes("attachments"),
    getOption: () => ({
      commandKey: "attachment",
      key: "attachment",
      title: "Attachment",
      description: "Insert a file",
      searchTerms: ["image", "photo", "picture", "pdf", "media", "upload", "audio", "video", "file", "attachment"],
      icon: <Paperclip className="size-3.5" />,
      command: ({ editor, range }) => insertAttachment({ editor, event: "insert", range }),
      section: "general",
      pushAfter: "image",
    }),
  },
];

const extensionRegistry: TRichTextEditorAdditionalExtensionsRegistry[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: (props) => {
      const { disabledExtensions, flaggedExtensions } = props;
      // Get enabled slash command options from the registry
      const slashCommandOptions = slashCommandRegistry
        .filter((command) => command.isEnabled(disabledExtensions, flaggedExtensions))
        .map((command) => command.getOption(props))
        .filter((option): option is TSlashCommandAdditionalOption => option !== null);

      return SlashCommands({
        additionalOptions: slashCommandOptions,
        disabledExtensions,
        flaggedExtensions,
      });
    },
  },
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("attachments"),
    getExtension: ({ flaggedExtensions, fileHandler }) =>
      CustomAttachmentExtension({
        fileHandler,
        isFlagged: flaggedExtensions.includes("attachments"),
        isEditable: true,
      }),
  },
];

export const RichTextEditorAdditionalExtensions = (props: TRichTextEditorAdditionalExtensionsProps) => {
  const { disabledExtensions, flaggedExtensions } = props;

  const extensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions, flaggedExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return extensions;
};
