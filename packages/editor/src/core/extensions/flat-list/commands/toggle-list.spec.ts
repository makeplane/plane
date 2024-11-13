import { describe, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { createToggleListCommand } from './toggle-list'

describe('toggleList', () => {
  const t = setupTestingEditor()
  const { doc, p, orderedList, bulletList, uncheckedTaskList } = t
  const toggleList = createToggleListCommand({ kind: 'ordered' })

  it('can toggle list', () => {
    const doc1 = doc(p('P1<cursor>'), p('P2'))
    const doc2 = doc(orderedList(p('P1<cursor>')), p('P2'))

    t.applyCommand(toggleList, doc1, doc2)
    t.applyCommand(toggleList, doc2, doc1)
  })

  it('can toggle list with multiple selected paragraphs', () => {
    const doc1 = doc(p('P1'), p('<start>P2'), p('P3<end>'), p('P4'))
    const doc2 = doc(
      p('P1'),
      orderedList(p('<start>P2')),
      orderedList(p('P3<end>')),
      p('P4'),
    )

    t.applyCommand(toggleList, doc1, doc2)
    t.applyCommand(toggleList, doc2, doc1)
  })

  it('can toggle a list to another kind', () => {
    const toggleBullet = createToggleListCommand({ kind: 'bullet' })
    const toggleTask = createToggleListCommand({ kind: 'task' })

    const doc1 = doc(p('P1<cursor>'), p('P2'))
    const doc2 = doc(uncheckedTaskList(p('P1<cursor>')), p('P2'))
    const doc3 = doc(bulletList(p('P1<cursor>')), p('P2'))

    t.applyCommand(toggleTask, doc1, doc2)
    t.applyCommand(toggleBullet, doc2, doc3)
    t.applyCommand(toggleTask, doc3, doc2)
    t.applyCommand(toggleTask, doc2, doc1)
  })
})
