import { Mention, MentionOptions } from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'

export interface CustomMentionOptions extends MentionOptions {
  HTMLAttributes: {
    'class' : string,
    'data-mention-type' : string | undefined,
    'data-mention-id': string | undefined,
  }
}

export const CustomMention = Mention.extend<CustomMentionOptions>({
  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
      type: {
        default: null,
      }
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-mention-id]',
        getAttrs: (node: string | HTMLElement) => {
          if (typeof node === 'string') {
            return null;
          }
          return {
            id: node.getAttribute('data-mention-id') || '',
            type: node.getAttribute('data-mention-type') || '',
            label: node.innerText.slice(1) || '',
          }
        },
      },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-mention-type' : node.attrs.type,
      'data-mention-id': node.attrs.id,
    }), `@${node.attrs.label}`]
  },
})
