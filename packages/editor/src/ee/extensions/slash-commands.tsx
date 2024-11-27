import { MessageSquareText } from "lucide-react";
// extensions
import { TSlashCommandAdditionalOption } from "@/extensions";
// types
import { TExtensions } from "@/types";
// helpers
import { insertCallout } from "src/ee/helpers/editor-commands";

type Props = {
  disabledExtensions: TExtensions[];
};

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const { disabledExtensions } = props;
  const options: TSlashCommandAdditionalOption[] = [];
  if (!disabledExtensions.includes("callout")) {
    options.push({
      commandKey: "callout",
      key: "callout",
      title: "Callout",
      description: "Insert callout",
      searchTerms: ["callout", "comment", "message", "info", "alert"],
      icon: <MessageSquareText className="size-3.5" />,
      command: ({ editor, range }) => insertCallout(editor, range),
      section: "general",
      pushAfter: "image",
    });
  }

  return options;
};
