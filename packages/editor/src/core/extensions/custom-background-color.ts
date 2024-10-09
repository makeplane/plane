import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    backgroundColor: {
      /**
       * Set the background color
       * @param color The color to set
       * @example editor.commands.setBackgroundColor('red')
       */
      setBackgroundColor: (color: string) => ReturnType;

      /**
       * Unset the background color
       * @example editor.commands.unsetBackgroundColor()
       */
      unsetBackgroundColor: () => ReturnType;
    };
  }
}

export const CustomBackgroundColorExtension = Extension.create({
  name: "customBackgroundColor",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute("data-background-color"),
            renderHTML: (attributes: { backgroundColor: string }) => {
              if (!attributes.backgroundColor) {
                return {};
              }
              return {
                "data-background-color": attributes.backgroundColor,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setBackgroundColor:
        (backgroundColor: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { backgroundColor }).run(),
      unsetBackgroundColor:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { backgroundColor: null }).run(),
    };
  },
});
