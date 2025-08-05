// extensions
import { Sigma, SquareRadical } from "lucide-react";
import { TSlashCommandAdditionalOption } from "@/extensions";
// types
import type { IEditorProps } from "@/types";
import { ProBadge } from "../components/badges/pro-badge";
import { insertBlockMath, insertInlineMath } from "../helpers/editor-commands";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions">;

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const { flaggedExtensions } = props;

  // General options
  const options: TSlashCommandAdditionalOption[] = [];

  // Math options
  const mathOptions: TSlashCommandAdditionalOption[] = [
    {
      commandKey: "block-equation",
      key: "block-equation",
      title: "Block equation",
      description: "Insert block equation",
      searchTerms: ["math", "equation", "latex", "formula", "block"],
      icon: <Sigma className="size-3.5" />,
      command: ({ editor, range }) => {
        insertBlockMath({ editor, range });
      },
      section: "general",
      pushAfter: "attachment",
      badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
    },
    {
      commandKey: "inline-equation",
      key: "inline-equation",
      title: "Inline equation",
      description: "Insert inline equation",
      searchTerms: ["math", "equation", "latex", "formula", "inline"],
      icon: <SquareRadical className="size-3.5" />,
      command: ({ editor, range }) => {
        insertInlineMath({ editor, range });
      },
      section: "general",
      pushAfter: "block-equation",
      badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
    },
  ];

  options.push(...mathOptions);

  return options;
};
