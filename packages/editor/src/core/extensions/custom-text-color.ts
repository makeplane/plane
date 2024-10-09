import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    color: {
      /**
       * Set the text color
       * @param color The color to set
       * @example editor.commands.setColor('red')
       */
      setTextColor: (color: string) => ReturnType;

      /**
       * Unset the text color
       * @example editor.commands.unsetColor()
       */
      unsetTextColor: () => ReturnType;
    };
  }
}

export const CustomTextColorExtension = Extension.create({
  name: "customTextColor",

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
          color: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute("data-text-color"),
            renderHTML: (attributes: { color: string }) => {
              if (!attributes.color) {
                return {};
              }
              return {
                "data-text-color": attributes.color,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { color }).run(),
      unsetTextColor:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { color: null }).run(),
    };
  },
});
