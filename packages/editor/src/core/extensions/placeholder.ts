import { Placeholder } from "@tiptap/extension-placeholder";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// types
import type { IEditorProps } from "@/types";

type TArgs = {
  placeholder: IEditorProps["placeholder"];
};

export const CustomPlaceholderExtension = (args: TArgs) => {
  const { placeholder } = args;

  return Placeholder.configure({
    placeholder: ({ editor, node }) => {
      if (!editor.isEditable) return "";

      if (node.type.name === CORE_EXTENSIONS.HEADING) return `Heading ${node.attrs.level}`;

      const isUploadInProgress = editor.storage.utility?.uploadInProgress;

      if (isUploadInProgress) return "";

      const shouldHidePlaceholder =
        editor.isActive(CORE_EXTENSIONS.TABLE) ||
        editor.isActive(CORE_EXTENSIONS.CODE_BLOCK) ||
        editor.isActive(CORE_EXTENSIONS.IMAGE) ||
        editor.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE);

      if (shouldHidePlaceholder) return "";

      if (placeholder) {
        if (typeof placeholder === "string") return placeholder;
        else return placeholder(editor.isFocused, editor.getHTML());
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  });
};
