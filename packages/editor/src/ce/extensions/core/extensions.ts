import type { Extensions } from "@tiptap/core";
// types
import type { IEditorProps } from "@/types";

export type TCoreAdditionalExtensionsProps = Pick<
  IEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "fileHandler"
>;

export const CoreEditorAdditionalExtensions = (props: TCoreAdditionalExtensionsProps): Extensions => {
  const {} = props;
  return [];
};
