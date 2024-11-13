import { type Transaction } from 'prosemirror-state'

export function mapPos(tr: Transaction, pos: number) {
  let nextStepIndex = tr.steps.length

  const getPos = (): number => {
    if (nextStepIndex < tr.steps.length) {
      const mapping = tr.mapping.slice(nextStepIndex)
      nextStepIndex = tr.steps.length
      pos = mapping.map(pos)
    }
    return pos
  }

  return getPos
}
