import { Extension } from '@tiptap/core';

export const EnterKeyExtension = Extension.create({
  name: 'enterKey',

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        console.log('Submit comment');
        return true;
      },
    }
  },
});
