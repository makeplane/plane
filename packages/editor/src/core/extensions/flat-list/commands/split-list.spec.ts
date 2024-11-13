import { NodeSelection } from 'prosemirror-state'
import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { enterCommand } from './keymap'

describe('splitList', () => {
  const {
    add,
    doc,
    p,
    bulletList,
    blockquote,
    editor,
    markdown,
    applyCommand,
    collapsedToggleList,
    expandedToggleList,
    checkedTaskList,
    uncheckedTaskList,
  } = setupTestingEditor()

  it('can split non-empty item', () => {
    applyCommand(
      enterCommand,
      markdown`
        - 123
        - 234<cursor>

        paragraph
      `,
      markdown`
        - 123
        - 234
        - <cursor>

        paragraph
      `,
    )

    applyCommand(
      enterCommand,
      markdown`
        - 123
        - 23<cursor>4
      `,
      markdown`
        - 123
        - 23
        - <cursor>4
      `,
    )

    applyCommand(
      enterCommand,
      markdown`
        - 1<cursor>23
        - 234
      `,
      markdown`
        - 1
        - <cursor>23
        - 234
      `,
    )
  })

  it('can split non-empty sub item', () => {
    applyCommand(
      enterCommand,
      markdown`
        - 123
          - 456<cursor>

        paragraph
      `,
      markdown`
        - 123
          - 456
          - <cursor>

        paragraph
      `,
    )
  })

  it('can delete empty item', () => {
    applyCommand(
      enterCommand,
      markdown`
        - 123
        - <cursor>

        paragraph
      `,
      markdown`
        - 123

        <cursor>

        paragraph
      `,
    )

    applyCommand(
      enterCommand,
      markdown`
        - 123
        - <cursor>
        - 456
      `,
      markdown`
        - 123

        <cursor>

        - 456
      `,
    )

    applyCommand(
      enterCommand,
      markdown`
        - <cursor>
        - 123
      `,
      markdown`
        <cursor>

        - 123
      `,
    )
  })

  it('can dedent the last empty sub item', () => {
    applyCommand(
      enterCommand,
      markdown`
        - A1

          - <cursor>

        paragraph
      `,
      markdown`
        - A1

        - <cursor>

        paragraph
      `,
    )

    applyCommand(
      enterCommand,
      markdown`
        - A1

          - B1

          - <cursor>

        paragraph
      `,
      markdown`
        - A1

          - B1

        - <cursor>

        paragraph
      `,
    )
  })

  it('can delete selected text', () => {
    applyCommand(
      enterCommand,
      markdown`
        - <start>123<end>
        - 456
      `,
      markdown`
        -
        - <cusror>
        - 456
      `,
    )
  })

  it('can set attributes correctly', () => {
    applyCommand(
      enterCommand,
      doc(
        checkedTaskList(p('<cursor>A1')),
        uncheckedTaskList(p('A2')),
        uncheckedTaskList(p('A3')),
      ),
      doc(
        uncheckedTaskList(p('')),
        checkedTaskList(p('<cursor>A1')),
        uncheckedTaskList(p('A2')),
        uncheckedTaskList(p('A3')),
      ),
    )

    applyCommand(
      enterCommand,
      doc(
        uncheckedTaskList(p('A1')),
        checkedTaskList(p('A2<cursor>')),
        uncheckedTaskList(p('A3')),
      ),
      doc(
        uncheckedTaskList(p('A1')),
        checkedTaskList(p('A2')),
        uncheckedTaskList(p('<cursor>')),
        uncheckedTaskList(p('A3')),
      ),
    )

    applyCommand(
      enterCommand,
      doc(
        uncheckedTaskList(p('A1')),
        checkedTaskList(p('A<cursor>2')),
        uncheckedTaskList(p('A3')),
      ),
      doc(
        uncheckedTaskList(p('A1')),
        checkedTaskList(p('A')),
        uncheckedTaskList(p('<cursor>2')),
        uncheckedTaskList(p('A3')),
      ),
    )
  })

  it('escapes the item when the cursor is in the first paragraph of the item', () => {
    applyCommand(
      enterCommand,
      markdown`
        - 123<cursor>

          456

          789
      `,
      markdown`
        - 123

        - <cursor>

          456

          789
      `,
    )

    // Nested list item
    applyCommand(
      enterCommand,
      markdown`
        - Parent

          - 123<cursor>

            456

            789
      `,
      markdown`
        - Parent

          - 123

          - <cursor>

            456

            789
      `,
    )
  })

  it('can create new paragraph when the caret is not inside the first child of the list', () => {
    // Cursor in the last paragraph of the item
    add(
      doc(
        bulletList(
          //
          p('123'),
          p('456<cursor>'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        bulletList(
          //
          p('123'),
          p('456'),
          p('<cursor>'),
        ),
      ),
    )

    // Cursor in the middle paragraph of the item
    add(
      doc(
        bulletList(
          //
          p('123'),
          p('456<cursor>'),
          p('789'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        bulletList(
          //
          p('123'),
          p('456'),
          p('<cursor>'),
          p('789'),
        ),
      ),
    )

    // Cursor in the last paragraph of the item (nested list item)
    add(
      doc(
        bulletList(
          p('parent'),
          bulletList(
            //
            p('123'),
            p('<cursor>456'),
          ),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        bulletList(
          p('parent'),
          bulletList(
            //
            p('123'),
            p(''),
            p('<cursor>456'),
          ),
        ),
      ),
    )

    add(
      doc(
        bulletList(
          //
          p('123'),
          p('<cursor>'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        bulletList(
          //
          p('123'),
          p(''),
          p('<cursor>'),
        ),
      ),
    )

    add(
      doc(
        bulletList(
          //
          p('123'),
          p('<cursor>'),
          p('456'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        bulletList(
          //
          p('123'),
          p(''),
          p('<cursor>'),
          p('456'),
        ),
      ),
    )
  })

  it('can skip collapsed content', () => {
    // Cursor in the last paragraph of the item
    add(
      doc(
        collapsedToggleList(
          //
          p('1<start>23<end>'),
          p('456'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        collapsedToggleList(
          //
          p('1'),
          p('456'),
        ),
        expandedToggleList(
          //
          p('<cursor>'),
        ),
      ),
    )
  })

  it("won't effect non-list document", () => {
    applyCommand(
      enterCommand,
      markdown`
        # h1

        1<cursor>23
      `,
      null,
    )

    applyCommand(
      enterCommand,
      markdown`
        # h1

        123

        > 4<cursor>56
      `,
      null,
    )

    add(
      doc(
        blockquote(
          p('123'),
          blockquote(
            //
            p('4<cursor>56'),
          ),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        blockquote(
          p('123'),
          blockquote(
            //
            p('4'),
            p('<cursor>56'),
          ),
        ),
      ),
    )
  })

  it('can split list node for a block node selection', () => {
    add(markdown`
      # h1

      1. ***
    `)

    let hrPos = -1
    editor.doc.descendants((node, pos) => {
      if (node.type.name === 'horizontalRule') {
        hrPos = pos
      }
    })

    expect(hrPos > -1).toBe(true)
    const nodeSelection = NodeSelection.create(editor.state.doc, hrPos)
    editor.view.dispatch(editor.view.state.tr.setSelection(nodeSelection))
    expect(editor.view.state.selection.toJSON()).toMatchInlineSnapshot(`
      {
        "anchor": 5,
        "type": "node",
      }
    `)

    editor.press('Enter')

    expect(editor.state).toEqualRemirrorState(markdown`
      # h1

      1. ***
      2. <cursor>\n
    `)
  })
})
