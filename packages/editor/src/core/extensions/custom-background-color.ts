import { Extension } from "@tiptap/core";
// constants
import { COLORS_LIST } from "@/constants/common";

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
              const { backgroundColor } = attributes;
              if (!backgroundColor) {
                return {};
              }

              let elementAttributes: Record<string, string> = {
                "data-background-color": backgroundColor,
              };

              if (!COLORS_LIST.find((c) => c.key === backgroundColor)) {
                elementAttributes = {
                  ...elementAttributes,
                  style: `background-color: ${backgroundColor}`,
                };
              }

              return elementAttributes;
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
