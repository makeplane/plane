import type { Extensions } from "@tiptap/core";
// types
import type { IEditorProps } from "@/types";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions" | "fileHandler">;

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const {} = props;
  return [];
};
