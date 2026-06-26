import { describe, expect, it } from 'vitest'
import { decodeResult, encodeResult } from '~/utils/resultCodec'
import type { ResultState } from '~/core/types'

const base: ResultState = {
  v: { fire: 0.86, earth: 0.32, air: 0.66, water: 0.28, expr: 0.74, order: 0.38 },
  sign: 'aries',
  ageBand: 2,
}

describe('result URL codec', () => {
  it('round-trips a minimal result within byte precision', () => {
    const out = decodeResult(encodeResult(base))!
    expect(out.sign).toBe('aries')
    expect(out.ageBand).toBe(2)
    for (const d of Object.keys(base.v) as (keyof typeof base.v)[]) {
      expect(out.v[d]).toBeCloseTo(base.v[d], 2)
    }
    expect(out.mutated).toBeUndefined()
    expect(out.ideal).toBeUndefined()
  })

  it('preserves mutation level + drivers and an ideal vector', () => {
    const full: ResultState = {
      ...base,
      sign: 'pisces',
      mutated: { level: 2, dims: ['water', 'order'] },
      ideal: { fire: 0.2, earth: 0.4, air: 0.5, water: 0.9, expr: 0.3, order: 0.6 },
    }
    const out = decodeResult(encodeResult(full))!
    expect(out.sign).toBe('pisces')
    expect(out.mutated).toEqual({ level: 2, dims: ['water', 'order'] })
    expect(out.ideal?.water).toBeCloseTo(0.9, 2)
  })

  it('produces a short, URL-safe token', () => {
    const token = encodeResult(base)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeLessThan(32)
  })

  it('returns null on garbage input', () => {
    expect(decodeResult('not-a-real-token!!')).toBeNull()
    expect(decodeResult('')).toBeNull()
  })
})
