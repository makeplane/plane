import type { Extensions } from "@tiptap/core";
// types
import type { IReadOnlyEditorProps } from "@/types";

export type TCoreReadOnlyEditorAdditionalExtensionsProps = Pick<
  IReadOnlyEditorProps,
  "disabledExtensions" | "flaggedExtensions" | "embedHandler"
>;

export const CoreReadOnlyEditorAdditionalExtensions = (
  props: TCoreReadOnlyEditorAdditionalExtensionsProps
): Extensions => {
  const {} = props;
  return [];
};
