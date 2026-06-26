import { describe, expect, it } from 'vitest'
import type { Question } from '~/core/types'
import { archetypeKey, dominantDims, missingDims, score } from '~/core/personality'
import { questions } from './fixtures'

const q = (id: string, opts: Question['options']): Question => ({ id, tier: 'quick', options: opts })

describe('score', () => {
  it('min–max normalizes each answered dim to [0,1]', () => {
    const qs = [q('q1', [{ id: 'a', weights: { fire: 2 } }, { id: 'b', weights: { earth: 2 } }])]
    const v = score(qs, { q1: 'a' })
    expect(v.fire).toBe(1) // raw 2 over range [0,2]
    expect(v.earth).toBe(0) // raw 0 over range [0,2]
    expect(v.air).toBe(0.5) // untouched dim → midpoint
  })

  it('handles negative weights symmetrically', () => {
    const qs = [q('q1', [{ id: 'a', weights: { expr: 2 } }, { id: 'b', weights: { expr: -2 } }])]
    expect(score(qs, { q1: 'a' }).expr).toBe(1)
    expect(score(qs, { q1: 'b' }).expr).toBe(0)
  })

  it('only answered questions contribute to the range', () => {
    const qs = [
      q('q1', [{ id: 'a', weights: { fire: 2 } }, { id: 'b', weights: { fire: 0 } }]),
      q('q2', [{ id: 'a', weights: { fire: 4 } }, { id: 'b', weights: { fire: 0 } }]),
    ]
    // answering only q1='a' → fire range [0,2], raw 2 → 1 (q2 ignored)
    expect(score(qs, { q1: 'a' }).fire).toBe(1)
  })

  it('returns all 0.5 when nothing is answered', () => {
    const v = score(questions, {})
    expect(Object.values(v).every((x) => x === 0.5)).toBe(true)
  })

  it('keeps every dim within [0,1] for the real bank with all-A answers', () => {
    const answers = Object.fromEntries(questions.map((x) => [x.id, 'a']))
    const v = score(questions, answers)
    for (const val of Object.values(v)) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(1)
    }
  })
})

describe('dominant / missing dims', () => {
  const v = { fire: 0.9, earth: 0.2, air: 0.6, water: 0.1, expr: 0.7, order: 0.4 }
  it('orders dominant dims by descending value', () => {
    expect(dominantDims(v, 2)).toEqual(['fire', 'expr'])
  })
  it('orders missing dims by ascending value', () => {
    expect(missingDims(v, 1)).toEqual(['water'])
  })
  it('derives an archetype key from dominant element + dominant + missing', () => {
    const key = archetypeKey(v)
    expect(key.element).toBe('fire')
    expect(key.missing).toBe('water')
    expect(key.dominant).toContain('fire')
  })
})
