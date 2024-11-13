import { describe, it, expect } from 'vitest'

import { parseInteger } from './parse-integer'

describe('parseInteger', () => {
  it('can parse integer string', () => {
    expect(parseInteger('0')).toBe(0)
    expect(parseInteger('1')).toBe(1)
    expect(parseInteger('-10')).toBe(-10)
    expect(parseInteger('999')).toBe(999)
  })

  it('can parse float string', () => {
    expect(parseInteger('1.1')).toBe(1)
    expect(parseInteger('1.9')).toBe(1)
    expect(parseInteger('-1.1')).toBe(-1)
    expect(parseInteger('-1.9')).toBe(-1)
    expect(parseInteger('-999.9')).toBe(-999)
  })

  it('can parse non number', () => {
    expect(parseInteger('Hello')).toBe(null)
    // @ts-expect-error: wrong parameter type
    expect(parseInteger(true)).toBe(null)
    // @ts-expect-error: wrong parameter type
    expect(parseInteger(false)).toBe(null)
    // @ts-expect-error: wrong parameter type
    expect(parseInteger({ object: 'object' })).toBe(null)
    // @ts-expect-error: wrong parameter type
    expect(parseInteger(Number.NaN)).toBe(null)
  })

  it('can parse number', () => {
    // @ts-expect-error: wrong parameter type
    expect(parseInteger(-1)).toBe(-1)
    // @ts-expect-error: wrong parameter type
    expect(parseInteger(100.1)).toBe(100)
  })

  it('can handle null and undefined', () => {
    expect(parseInteger(null)).toBe(null)
    expect(parseInteger(undefined)).toBe(null)
  })
})
