import { type TaggedProsemirrorNode } from 'jest-remirror'
import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { splitBoundary } from './split-boundary'

describe('splitBoundary', () => {
  const t = setupTestingEditor()

  const check = ({
    before,
    after,
    pos,
    depth,
  }: {
    before: TaggedProsemirrorNode
    after?: TaggedProsemirrorNode
    pos?: number
    depth: number
  }) => {
    const tr = t.add(before).tr
    pos = pos ?? tr.selection.$from.pos
    splitBoundary(tr, pos, depth)
    expect(tr.doc).toEqualRemirrorDocument(after ?? before)
  }

  it.each([
    {
      pos: 4,
      depth: 1,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('A'),
            t.p('B'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 4,
      depth: 2,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('A'),
          ),
          t.bulletList(
            //
            t.p('B'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 4,
      depth: 3,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('A'),
          ),
        ),
        t.bulletList(
          t.bulletList(
            //
            t.p('B'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 3,
      depth: 1,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 3,
      depth: 2,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 5,
      depth: 1,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 5,
      depth: 2,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
          ),
          t.bulletList(
            //
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 6,
      depth: 1,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
          ),
          t.bulletList(
            //
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 6,
      depth: 2,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
          ),
        ),
        t.bulletList(
          t.bulletList(
            //
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 2,
      depth: 1,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
            t.p('CD'),
          ),
        ),
      ),
    },

    {
      pos: 2,
      depth: 2,
      before: t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.bulletList(
            /*2*/
            t.p(/*3*/ 'AB' /*5*/),
            /*6*/
            t.p(/*7*/ 'CD' /*9*/),
            /*10*/
          ),
          /*11*/
        ),
        /*12*/
      ),
      after: t.doc(
        t.bulletList(
          t.bulletList(
            //
            t.p('AB'),
            t.p('CD'),
          ),
        ),
      ),
    },
  ])('can split node %#', check)
})
