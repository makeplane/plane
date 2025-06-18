import type { Extensions } from "@tiptap/core";
// types
import type { IReadOnlyEditorProps } from "@/types";

type Props = Pick<IReadOnlyEditorProps, "disabledExtensions" | "flaggedExtensions">;

export const CoreReadOnlyEditorAdditionalExtensions = (props: Props): Extensions => {
  const {} = props;
  return [];
};
