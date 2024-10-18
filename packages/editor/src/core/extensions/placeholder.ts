import Placeholder from "@tiptap/extension-placeholder";

type Props = {
  placeholder?: string | ((isFocused: boolean, value: string) => string);
};

export const CustomPlaceholderExtension = (props: Props) => {
  const { placeholder } = props;

  return Placeholder.configure({
    placeholder: ({ editor, node }) => {
      if (node.type.name === "heading") return `Heading ${node.attrs.level}`;

      if (editor.storage.imageComponent.uploadInProgress) return "";

      const shouldHidePlaceholder =
        editor.isActive("table") || editor.isActive("codeBlock") || editor.isActive("image");

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
