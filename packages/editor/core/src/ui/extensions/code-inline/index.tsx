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
export const pasteRegex = /(?:^|\s)((?:`)((?:[^`]+))(?:`))/g;

export const CustomCodeInlineExtension = Mark.create<CodeOptions>({
  name: "code",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "rounded-md bg-custom-primary-30 mx-1 px-1 py-[2px] font-mono font-medium text-custom-text-1000",
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
