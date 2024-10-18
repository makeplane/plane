import StarterKit from "@tiptap/starter-kit";

export const CustomStarterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: "list-disc pl-7 space-y-2",
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: "list-decimal pl-7 space-y-2",
    },
  },
  listItem: {
    HTMLAttributes: {
      class: "not-prose space-y-2",
    },
  },
  code: false,
  codeBlock: false,
  horizontalRule: false,
  blockquote: false,
  dropcursor: {
    class: "text-custom-text-300",
  },
});
