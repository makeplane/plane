import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { backspaceCommand } from './keymap'

describe('Keymap', () => {
  const t = setupTestingEditor()
  const markdown = t.markdown

  describe('Backspace', () => {
    it('should delete the empty paragraph between two list nodes', () => {
      t.applyCommand(
        backspaceCommand,
        t.doc(
          t.bulletList(t.p('A1')),
          t.p('<cursor>'),
          t.bulletList(t.p('A2')),
        ),
        t.doc(t.bulletList(t.p('A1')), t.bulletList(t.p('A2'))),
      )
    })

    it('can handle nested list', () => {
      const doc1 = markdown`
        - A1

          - B1

          - <cursor>B2
      `
      const doc2 = markdown`
        - A1

          - B1

          <cursor>B2
      `
      const doc3 = markdown`
        - A1

          - B1

        <cursor>B2
      `
      const doc4 = markdown`
        - A1

          - B1<cursor>B2
      `

      t.add(doc1)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc2)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc3)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc4)
    })

    it('can handle nested list with multiple children', () => {
      const doc1 = markdown`
        - A1

          - B1

          - <cursor>B2a

            B2b

            B2c
      `
      const doc2 = markdown`
        - A1

          - B1

          <cursor>B2a

          B2b

          B2c
      `
      const doc3 = markdown`
        - A1

          - B1<cursor>B2a

          B2b

          B2c
      `

      t.add(doc1)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc2)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc3)
    })

    it('can handle cursor in the middle child', () => {
      const doc1 = markdown`
        - A1

          - B1

          - B2a

            <cursor>B2b

            B2c
      `
      const doc2 = markdown`
        - A1

          - B1

          - B2a<cursor>B2b

            B2c
      `
      t.add(doc1)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc2)
    })

    it('can handle cursor in the last child', () => {
      const doc1 = markdown`
        - A1

          - B1

          - B2a

            B2b

            <cursor>B2c
      `
      const doc2 = markdown`
        - A1

          - B1

          - B2a

            B2b

          <cursor>B2c
      `
      const doc3 = markdown`
        - A1

          - B1

          - B2a

            B2b

        <cursor>B2c
      `
      t.add(doc1)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc2)
      t.editor.press('Backspace')
      expect(t.editor.state).toEqualRemirrorState(doc3)
    })

    it('can skip collapsed content', () => {
      t.applyCommand(
        backspaceCommand,
        t.doc(
          t.collapsedToggleList(
            //
            t.p('A1'),
            t.bulletList(t.p('B1')),
          ),
          t.p('<cursor>A2'),
        ),
        t.doc(
          t.collapsedToggleList(
            //
            t.p('A1<cursor>A2'),
            t.bulletList(t.p('B1')),
          ),
        ),
      )

      t.applyCommand(
        backspaceCommand,
        t.doc(
          t.collapsedToggleList(
            //
            t.p('A1'),
            t.bulletList(t.p('B1')),
          ),
          t.blockquote(t.p('<cursor>A2')),
        ),
        t.doc(
          t.collapsedToggleList(
            //
            t.p('A1<cursor>A2'),
            t.bulletList(t.p('B1')),
          ),
        ),
      )
    })
  })
})
