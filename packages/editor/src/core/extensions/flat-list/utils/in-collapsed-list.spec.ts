import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { inCollapsedList } from './in-collapsed-list'

describe('inCollapsedList', () => {
  const t = setupTestingEditor()

  it('returns false in a normal paragraph', () => {
    t.add(t.doc(t.p('Hello world<cursor>')))
    expect(inCollapsedList(t.view.state.selection.$from)).toBe(false)
  })

  it('returns true in a collapsed list node', () => {
    t.add(
      t.doc(
        t.collapsedToggleList(
          t.p('Visible content<cursor>'),
          t.p('Hidden content'),
        ),
      ),
    )
    expect(inCollapsedList(t.view.state.selection.$from)).toBe(true)
  })

  it('returns false in a expanded list node', () => {
    t.add(
      t.doc(
        t.expandedToggleList(
          t.p('Visible content'),
          t.p('Visible content<cursor>'),
        ),
      ),
    )
    expect(inCollapsedList(t.view.state.selection.$from)).toBe(false)
  })
})
