// extensions
import { FileCode2, Sigma, SquareRadical } from "lucide-react";
import { TSlashCommandAdditionalOption } from "@/extensions";
// types
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
import type { CommandProps, IEditorProps, TExtensions } from "@/types";
// plane editor
import { ProBadge } from "../components/badges/pro-badge";
import { insertBlockMath, insertExternalEmbed, insertInlineMath } from "../helpers/editor-commands";
import { EMBED_SEARCH_TERMS } from "./external-embed/constants";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions">;

const coreSlashCommandRegistry: {
  isEnabled: (disabledExtensions: TExtensions[], flaggedExtensions: TExtensions[]) => boolean;
  getOption: (props: Props) => TSlashCommandAdditionalOption;
}[] = [
  {
    // Block equation slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("mathematics") && !disabledExtensions?.includes("mathematics"),
    getOption: ({ flaggedExtensions }) => ({
      commandKey: "block-equation",
      key: "block-equation",
      title: "Block equation",
      description: "Insert block equation",
      searchTerms: ["math", "equation", "latex", "formula", "block"],
      icon: <Sigma className="size-3.5" />,
      command: ({ editor, range }) => {
        insertBlockMath({ editor, range, latex: "" });
      },
      section: "general",
      pushAfter: "attachment",
      badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
    }),
  },
  {
    // Inline equation slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("mathematics") && !disabledExtensions?.includes("mathematics"),
    getOption: ({ flaggedExtensions }) => ({
      commandKey: "inline-equation",
      key: "inline-equation",
      title: "Inline equation",
      description: "Insert inline equation",
      searchTerms: ["math", "equation", "latex", "formula", "inline"],
      icon: <SquareRadical className="size-3.5" />,
      command: ({ editor, range }) => {
        insertInlineMath({ editor, range, latex: "" });
      },
      section: "general",
      pushAfter: "block-equation",
      badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
    }),
  },
  {
    // External embed slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("external-embed") && !disabledExtensions?.includes("external-embed"),
    getOption: ({ flaggedExtensions }) => ({
      commandKey: "external-embed",
      key: "embed",
      title: "Embed",
      icon: <FileCode2 className="size-3.5" />,
      description: "Insert an Embed",
      searchTerms: EMBED_SEARCH_TERMS,
      command: ({ editor, range }: CommandProps) =>
        insertExternalEmbed({ editor, range, [EExternalEmbedAttributeNames.IS_RICH_CARD]: false }),
      badge: flaggedExtensions?.includes("external-embed") ? <ProBadge /> : undefined,
      section: "general",
      pushAfter: "code",
    }),
  },
];

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const { disabledExtensions = [], flaggedExtensions = [] } = props;

  // Filter enabled slash command options from the registry
  const options = coreSlashCommandRegistry
    .filter((command) => command.isEnabled(disabledExtensions, flaggedExtensions))
    .map((command) => command.getOption(props));

  return options;
};
