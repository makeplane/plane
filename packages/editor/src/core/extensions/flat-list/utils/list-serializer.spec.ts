import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { ListDOMSerializer } from './list-serializer'

describe('ListDOMSerializer', () => {
  const {
    add,
    doc,
    p,
    bulletList,
    orderedList,
    uncheckedTaskList: taskList,
    expandedToggleList: toggleList,
    schema,
  } = setupTestingEditor()

  let editor: ReturnType<typeof add>

  it('can serialize list nodes into <ul>', () => {
    editor = add(doc(bulletList(p('A')), bulletList(p('B'))))

    const serializer = ListDOMSerializer.fromSchema(schema)

    const serialized = serializer.serializeFragment(editor.state.doc.content)
    expect(serialized.querySelectorAll('ul').length).toBe(1)
    expect(serialized.querySelectorAll('ol').length).toBe(0)
    expect(serialized.querySelectorAll('ul > li').length).toBe(2)
    expect(serialized).toMatchSnapshot()
  })

  it('can serialize list nodes into <ol>', () => {
    editor = add(doc(orderedList(p('A')), orderedList(p('B'))))

    const serializer = ListDOMSerializer.fromSchema(schema)

    const serialized = serializer.serializeFragment(editor.state.doc.content)

    expect(serialized.querySelectorAll('ul').length).toBe(0)
    expect(serialized.querySelectorAll('ol').length).toBe(1)
    expect(serialized.querySelectorAll('ol > li').length).toBe(2)
    expect(serialized).toMatchSnapshot()
  })

  it('can serialize list nodes with different types into a single <ul>', () => {
    editor = add(
      doc(
        bulletList(p('A')),
        taskList(p('B')),
        toggleList(p('C')),

        orderedList(p('D')),

        bulletList(p('D')),
        taskList(p('E')),
        toggleList(p('D')),
      ),
    )

    const serializer = ListDOMSerializer.fromSchema(schema)

    const serialized = serializer.serializeFragment(editor.state.doc.content)

    expect(serialized.querySelectorAll('ul').length).toBe(2)
    expect(serialized.querySelectorAll('ol').length).toBe(1)
    expect(serialized.querySelectorAll('ul > li').length).toBe(6)
    expect(serialized.querySelectorAll('ol > li').length).toBe(1)
    expect(serialized).toMatchSnapshot()
  })

  it('can serialize nested list node ', () => {
    editor = add(
      doc(
        bulletList(p('A'), orderedList(p('B')), orderedList(p('C'))),
        bulletList(p('D'), orderedList(p('E')), orderedList(p('F'))),
      ),
    )

    const serializer = ListDOMSerializer.fromSchema(schema)

    const serialized = serializer.serializeFragment(editor.state.doc.content)

    expect(serialized.querySelectorAll('ul').length).toBe(1)
    expect(serialized.querySelectorAll('ol').length).toBe(2)
    expect(serialized.querySelectorAll('ul > li').length).toBe(2)
    expect(serialized.querySelectorAll('ol > li').length).toBe(4)
    expect(serialized).toMatchSnapshot()
  })
})
