import type { Editor } from "@tiptap/core";
import { TExtendedEditorRefApi } from "../types";

type TArgs = {
  editor: Editor | null;
};

export const getExtenedEditorRefHelpers = (args: TArgs): TExtendedEditorRefApi => {
  const { editor } = args;

  return {};
};
