import { Extensions } from "@tiptap/core";
// types
import { TExtensions } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
};

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const {} = props;
  return [];
};
