import ListItem from '@tiptap/extension-list-item'

export const CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () => this.editor.chain().focus().splitListItem('listItem').run(),
    }
  },
})
