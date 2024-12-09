// extensions
import { TSlashCommandAdditionalOption } from "@/extensions";
// types
import { TExtensions } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
};

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const {} = props;
  const options: TSlashCommandAdditionalOption[] = [];
  return options;
};
