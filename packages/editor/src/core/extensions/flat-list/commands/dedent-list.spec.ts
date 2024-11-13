import { type TaggedProsemirrorNode } from 'jest-remirror'
import { type Node as ProsemirrorNode } from 'prosemirror-model'
import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { createDedentListCommand } from './dedent-list'

describe('dedentList', () => {
  const t = setupTestingEditor()
  const markdown = t.markdown

  it('can dedent a list node to outer list', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1
          - B<cursor>1
      `,
      markdown`
        - A1
        - B<cursor>1
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - - <cursor>B1
        - A1
      `,
      markdown`
        - B1
        - A1
      `,
    )
  })

  it('can dedent a paragraph node to outer list', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1a

            B1b<cursor>
      `,
      markdown`
        - A1

          - B1a

          B1b<cursor>
      `,
    )
  })

  it('can unwrap a list node', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1<cursor>

        paragraph
      `,
      markdown`
        A1<cursor>

        paragraph
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1<cursor>
        - A2
      `,
      markdown`
        A1<cursor>

        - A2
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1
        - A2<cursor>
      `,
      markdown`
        - A1

        A2
      `,
    )
  })

  it('can unwrap multiple list nodes', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1<start>
        - A2<end>
      `,
      markdown`
        A1

        A2
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1
        - A2<start>
        - A3<end>
        - A4
      `,
      markdown`
        - A1

        A2

        A3

        - A4
      `,
    )
  })

  it('can keep siblings after the lifted items at the same position', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2<start>

          - B3

            - C1<end>

            B3

          - B4
      `,
      markdown`
        - A1

          - B1

        - B2<start>

        - B3

          - C1<end>

            B3

          - B4
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2<cursor>

          A1
      `,
      markdown`
        - A1

          - B1

        - B2<cursor>

          A1
      `,
    )
  })

  it('can only dedent selected part when the selection across multiple depth of a nested lists', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2

            - C1<start>

          - B3<end>
      `,
      markdown`
        - A1

          - B1

          - B2

          - C1<start>

        - B3<end>
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2

            - C1<start>

          - B3<end>

            - C2
      `,
      markdown`
        - A1

          - B1

          - B2

          - C1<start>

        - B3<end>

          - - C2
      `,
    )
  })

  it('can wrap unselected paragraphs with a list node if necessary', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2<start>

          - B3<end>

            B3

            B3

          - B4
      `,
      markdown`
        - A1

          - B1

        - B2<start>

        - B3<end>

          - B3

            B3

          - B4
      `,
    )
  })

  it('can keep the indentation of sub list', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1<cursor>

            - C1
      `,
      markdown`
        - A1

        - B1<cursor>

          - - C1
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1<cursor>

          - B1
      `,
      markdown`
        A1<cursor>

        - - B1
      `,
    )
  })

  it('do nothing when not inside a list', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        Hello<cursor>

        paragraph
      `,
      markdown`
        Hello<cursor>

        paragraph
      `,
    )
  })

  it('can dedent a nested list item', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - - B1<cursor>

            B1

          A1
      `,
      markdown`
        - B1

          - B1

          A1
      `,
    )
  })

  it('can dedent a blockquote inside a list', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - > A1
          >
          > A2<cursor>
      `,
      markdown`
        - > A1

          A2<cursor>
      `,
    )
  })

  it('can accept custom positions', () => {
    t.applyCommand(
      createDedentListCommand({ from: 13, to: 17 }),
      t.doc(
        /*0*/
        t.bulletList(/*1*/ t.p('A1') /*5*/),
        /*6*/
        t.bulletList(/*7*/ t.p('A2<cursor>') /*11*/),
        /*12*/
        t.bulletList(/*13*/ t.p('A3') /*17*/),
        /*18*/
      ),
      t.doc(
        //
        t.bulletList(t.p('A1')),
        t.bulletList(t.p('A2')),
        t.p('A3'),
      ),
    )

    t.applyCommand(
      createDedentListCommand({ from: 10, to: 14 }),
      t.doc(
        /*0*/
        t.bulletList(/*1*/ t.p('A1') /*5*/),
        /*6*/
        t.bulletList(/*7*/ t.p('A2<cursor>') /*11*/),
        /*12*/
        t.bulletList(/*13*/ t.p('A3') /*17*/),
        /*18*/
      ),
      t.doc(
        //
        t.bulletList(t.p('A1')),
        t.p('A2'),
        t.p('A3'),
      ),
    )
  })

  it('can handle some complex nested lists', () => {
    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1
          - B1
          - <start>B2
        - A2
          - B3
            - C1<end>
              - D1
          - B4
      `,
      markdown`
        - A1
          - B1
        - <start>B2

        A2

        - B3
          - C1<end>
            - - D1
          - B4
      `,
    )

    t.applyCommand(
      createDedentListCommand(),
      markdown`
        - A1

          - B1

          - B2

            - C1

              - D1

                D1<start>

        - A2

          - B3

            - C2

              C2

              - D2<end>

              C2

            - C3
      `,
      markdown`
        - A1

          - B1

          - B2

            - C1

              - D1

              D1<start>

        A2

        - B3

          - C2

            C2

            - D2<end>

              C2

            - C3
      `,
    )
  })

  it('only needs one step for some of the most comment indent action', () => {
    const countSteps = (
      doc: TaggedProsemirrorNode,
      expected: TaggedProsemirrorNode,
    ) => {
      t.add(doc)
      const state = t.view.state
      const command = createDedentListCommand()
      let count = -1
      let actual: ProsemirrorNode | null = null
      command(state, (tr) => {
        count = tr.steps.length
        actual = tr.doc
      })
      expect(actual).not.equal(null)
      expect(actual).toEqualRemirrorDocument(expected)
      return count
    }

    expect(
      countSteps(
        markdown`
          - A1
            - B1<cursor>
        `,
        markdown`
          - A1
          - B1<cursor>
        `,
      ),
    ).toBe(1)

    expect(
      countSteps(
        markdown`
          - A1
          - A2<cursor>
        `,
        markdown`
          - A1

          A2<cursor>
        `,
      ),
    ).toBe(1)

    expect(
      countSteps(
        markdown`
          # heading

          - A1<cursor>
        `,
        markdown`
          # heading

          A1<cursor>
        `,
      ),
    ).toBe(1)

    expect(
      countSteps(
        markdown`
          # heading

          - - A1<cursor>
        `,
        markdown`
          # heading

          - A1<cursor>
        `,
      ),
    ).toBe(1)
  })
})
