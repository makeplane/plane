import { Extension, Mark, mergeAttributes } from "@tiptap/core";
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
      /**
       * Set the text color
       * @param color The color to set
       * @example editor.commands.setColor('red')
       */
      setBackgroundColor: (color: string) => ReturnType;

      /**
       * Unset the text color
       * @example editor.commands.unsetColor()
       */
      unsetBackgroundColor: () => ReturnType;
    };
  }
}

export const CustomColorExtension = Mark.create({
  name: "customColor",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
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
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (node) => node.getAttribute("data-text-color") && null,
      },
      {
        tag: "span",
        getAttrs: (node) => node.getAttribute("data-background-color") && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { color }).run(),
      unsetTextColor:
        () =>
        ({ chain }) =>
          chain().setMark(this.name, { color: null }).run(),
      setBackgroundColor:
        (color: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { backgroundColor: color }).run(),
      unsetBackgroundColor:
        () =>
        ({ chain }) =>
          chain().setMark(this.name, { backgroundColor: null }).run(),
    };
  },
});
