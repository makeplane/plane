import StarterKit from "@tiptap/starter-kit";

type TArgs = {
  enableHistory: boolean;
};

export const CustomStarterKitExtension = (args: TArgs) => {
  const { enableHistory } = args;

  return StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-7 space-y-(--list-spacing-y)",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-7 space-y-(--list-spacing-y)",
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
    paragraph: {
      HTMLAttributes: {
        class: "editor-paragraph-block",
      },
    },
    heading: {
      HTMLAttributes: {
        class: "editor-heading-block",
      },
    },
    dropcursor: {
      class:
        "text-tertiary transition-all motion-reduce:transition-none motion-reduce:hover:transform-none duration-200 ease-[cubic-bezier(0.165, 0.84, 0.44, 1)]",
    },
    ...(enableHistory ? {} : { history: false }),
  });
};
