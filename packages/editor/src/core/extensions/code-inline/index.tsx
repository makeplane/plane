import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

export interface CodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    code: {
      /**
       * Set a code mark
       */
      setCode: () => ReturnType;
      /**
       * Toggle inline code
       */
      toggleCode: () => ReturnType;
      /**
       * Unset a code mark
       */
      unsetCode: () => ReturnType;
    };
  }
}

export const inputRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))$/;
const pasteRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;

export const CustomCodeInlineExtension = Mark.create<CodeOptions>({
  name: "code",

  addOptions() {
    return {
      HTMLAttributes: {
        class:
          "rounded bg-custom-background-80 px-[6px] py-[1.5px] font-mono font-medium text-orange-500 border-[0.5px] border-custom-border-200",
        spellcheck: "false",
      },
    };
  },

  excludes: "_",

  code: true,

  exitable: true,

  parseHTML() {
    return [{ tag: "code" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCode:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleCode:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetCode:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-e": () => this.editor.commands.toggleCode(),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ];
  },
});
