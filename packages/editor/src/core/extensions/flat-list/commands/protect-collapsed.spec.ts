import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

describe('protectCollapsed', () => {
  const { add, doc, p, editor, collapsedToggleList, expandedToggleList } =
    setupTestingEditor()

  it('can skip collapsed content', () => {
    // Cursor in the last paragraph of the item
    add(
      doc(
        collapsedToggleList(
          //
          p('1<start>23'),
          p('456'),
        ),
        collapsedToggleList(
          //
          p('123'),
          p('4<end>56'),
        ),
      ),
    )
    editor.press('Enter')
    expect(editor.state).toEqualRemirrorState(
      doc(
        expandedToggleList(
          //
          p('1<start>23'),
          p('456'),
        ),
        expandedToggleList(
          //
          p('123'),
          p('4<end>56'),
        ),
      ),
    )
  })
})
