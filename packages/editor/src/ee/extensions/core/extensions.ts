import { Extensions } from "@tiptap/core";
// types
import { TExtensions, TFileHandler } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
  fileHandler: TFileHandler;
};

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const {} = props;
  return [];
};
