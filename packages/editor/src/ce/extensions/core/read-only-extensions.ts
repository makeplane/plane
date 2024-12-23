import { Extensions } from "@tiptap/core";
// types
import { TExtensions } from "@/types";

type Props = {
  disabledExtensions: TExtensions[];
};

export const CoreReadOnlyEditorAdditionalExtensions = (props: Props): Extensions => {
  const {} = props;
  return [];
};
