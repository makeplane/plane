import { Extension } from "@tiptap/core";
// constants
import { COLORS_LIST } from "@/constants/common";

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
              const { color } = attributes;
              if (!color) {
                return {};
              }

              let elementAttributes: Record<string, string> = {
                "data-text-color": color,
              };

              if (!COLORS_LIST.find((c) => c.key === color)) {
                elementAttributes = {
                  ...elementAttributes,
                  style: `color: ${color}`,
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
