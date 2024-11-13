import { type Command } from 'prosemirror-state'
import { describe, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { withAutoFixList } from './auto-fix-list'

describe('autoJoinList', () => {
  const t = setupTestingEditor()

  it('should join two lists', () => {
    const command: Command = withAutoFixList((state, dispatch) => {
      const schema = state.schema
      dispatch?.(state.tr.replaceWith(8, 9, schema.text('C')))
      return true
    })

    t.applyCommand(
      command,

      t.doc(
        /*0*/
        t.bulletList(
          /*1*/
          t.p(/*2*/ 'A' /*3*/),
          /*4*/
        ),
        /*5*/
        t.bulletList(
          /*6*/
          t.bulletList(
            /*7*/
            t.p(/*8*/ 'B' /*9*/),
            /*10*/
          ),
        ),
      ),

      t.doc(
        t.bulletList(
          t.p('A'),
          t.bulletList(
            //
            t.p('C'),
          ),
        ),
      ),
    )
  })
})
