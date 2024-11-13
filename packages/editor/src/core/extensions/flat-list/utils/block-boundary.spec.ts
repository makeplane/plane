import { describe, expect, it } from 'vitest'

import { setupTestingEditor } from '../../test/setup-editor'

import { atEndBlockBoundary, atStartBlockBoundary } from './block-boundary'

describe('boundary', () => {
  const t = setupTestingEditor()

  const doc = t.doc(
    /*0*/
    t.bulletList(
      /*1*/
      t.p(/*2*/ 'A1' /*4*/),
      /*5*/
      t.p(/*6*/ 'A2' /*8*/),
      /*9*/
    ),
    /*10*/
    t.bulletList(
      /*11*/
      t.bulletList(
        /*12*/
        t.p(/*13*/ 'B1' /*15*/),
        /*16*/
      ),
    ),
  )

  it('atStartBoundary', () => {
    expect(atStartBlockBoundary(doc.resolve(14), 3)).toBe(true)
    expect(atStartBlockBoundary(doc.resolve(14), 2)).toBe(true)
    expect(atStartBlockBoundary(doc.resolve(14), 1)).toBe(true)
    expect(atStartBlockBoundary(doc.resolve(14), 0)).toBe(false)

    expect(atStartBlockBoundary(doc.resolve(8), 2)).toBe(true)
    expect(atStartBlockBoundary(doc.resolve(8), 1)).toBe(false)
    expect(atStartBlockBoundary(doc.resolve(8), 0)).toBe(false)
  })

  it('atEndBoundary', () => {
    expect(atEndBlockBoundary(doc.resolve(14), 3)).toBe(true)
    expect(atEndBlockBoundary(doc.resolve(14), 2)).toBe(true)
    expect(atEndBlockBoundary(doc.resolve(14), 1)).toBe(true)
    expect(atEndBlockBoundary(doc.resolve(14), 0)).toBe(true)

    expect(atEndBlockBoundary(doc.resolve(6), 2)).toBe(true)
    expect(atEndBlockBoundary(doc.resolve(6), 1)).toBe(true)
    expect(atEndBlockBoundary(doc.resolve(6), 0)).toBe(false)
  })
})
