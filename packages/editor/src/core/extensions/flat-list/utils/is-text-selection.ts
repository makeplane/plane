import { TextSelection } from 'prosemirror-state'

export function isTextSelection(value?: unknown): value is TextSelection {
  return Boolean(value && value instanceof TextSelection)
}
