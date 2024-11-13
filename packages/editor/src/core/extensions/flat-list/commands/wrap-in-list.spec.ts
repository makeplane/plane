import { Selection } from 'prosemirror-state'
import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { createWrapInListCommand } from './wrap-in-list'

describe('wrapInList', () => {
  const t = setupTestingEditor()
  const markdown = t.markdown

  const wrapInBulletList = createWrapInListCommand({ kind: 'bullet' })
  const wrapInOrderedList = createWrapInListCommand({ kind: 'ordered' })
  const wrapInTaskList = createWrapInListCommand({ kind: 'task' })

  it('can wrap a paragraph node to a list node', () => {
    t.applyCommand(
      wrapInBulletList,
      markdown`
        P1

        P2<cursor>
      `,
      markdown`
        P1

        - P2
      `,
    )
  })

  it('can wrap multiple paragraph nodes to list nodes', () => {
    t.applyCommand(
      wrapInTaskList,
      markdown`
        P1

        P2<start>

        P3<end>
      `,
      markdown`
        P1

        - [ ] P2
        - [ ] P3
      `,
    )
  })

  it('can change the type of an existing list node', () => {
    t.applyCommand(
      wrapInOrderedList,
      markdown`
        - P1

        - P2<cursor>
      `,
      markdown`
        - P1

        1. P2
      `,
    )
  })

  it('can change the type of multiple existing list nodes', () => {
    t.applyCommand(
      wrapInTaskList,
      markdown`
        - P1

        - P2<start>

        1. P3<end>
      `,
      markdown`
        - P1
        - [ ] P2
        - [ ] P3
      `,
    )
  })

  it('can keep the type of a list node with multiple paragraphs', () => {
    t.applyCommand(
      wrapInBulletList,
      markdown`
        - P1<cursor>

          P2

          P3

          P4
      `,
      markdown`
        - P1<cursor>

          P2

          P3

          P4
      `,
    )
  })

  it('can wrap a paragraph inside a list node to a sub-list node', () => {
    t.applyCommand(
      wrapInBulletList,
      markdown`
        - P1

          P2<cursor>

          P3
      `,
      markdown`
        - P1

          - P2<cursor>

          P3
      `,
    )
  })

  it('can wrap multiple paragraphs inside a list node to a sub-list node', () => {
    t.applyCommand(
      wrapInBulletList,
      markdown`
        - P1

          P2<start>

          P3<end>
      `,
      markdown`
        - P1

          - P2<start>

          - P3<end>
      `,
    )
  })

  it('should handle block node without content', () => {
    const doc1 = t.doc(/*0*/ t.p() /*2*/, t.horizontalRule() /*3*/)
    const doc2 = t.doc(t.p(), t.bulletList(t.horizontalRule()))

    t.add(doc1)
    const view = t.view
    const selection = Selection.atEnd(view.state.doc)
    expect(selection.from).toBe(2)
    view.dispatch(view.state.tr.setSelection(selection))

    wrapInBulletList(view.state, view.dispatch.bind(view), view)

    expect(view.state.doc).toEqualRemirrorDocument(doc2)
  })
})
