import { Mention, MentionOptions } from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import mentionNodeView from './mentionNodeView'
export interface CustomMentionOptions extends MentionOptions {
  HTMLAttributes: {
    'class': string,
    'data-mention-type': string | undefined,
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
      target: {
        default: null,
      },
      self: {
        default: false
      },
      redirect_uri: {
        default: "/"
      }
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(mentionNodeView)
  },

  parseHTML() {
    return [{
      tag: 'mention-component',
      getAttrs: (node: string | HTMLElement) => {
        if (typeof node === 'string') {
          return null;
        }
        return {
          id: node.getAttribute('data-mention-id') || '',
          type: node.getAttribute('data-mention-type') || '',
          label: node.innerText.slice(1) || '',
          self: node.getAttribute('self') || ''
        }
      },
    }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['mention-component', mergeAttributes(HTMLAttributes)]
  },
})



