import { Extension } from '@tiptap/core';

export const EnterKeyExtension = (onEnterKeyPress?: () => void) => Extension.create({
  name: 'enterKey',

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        if (onEnterKeyPress) {
          onEnterKeyPress();
        }
        return true;
      },
    }
  },
});
