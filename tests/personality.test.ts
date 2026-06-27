import { describe, expect, it } from 'vitest'
import { archetypeKey, dominantDims, dominantElement, missingDims, score } from '~/core/personality'
import type { AnswerMap, PersonalityVector } from '~/core/types'
import { items, maxScores } from './fixtures'

const allAnswers = (opt: string): AnswerMap => Object.fromEntries(items.map((q) => [q.id, opt]))

describe('score (v2: raw / maxScores)', () => {
  it('all-A → extreme fire/expr/air, zero earth/order (README reference)', () => {
    const v = score(items, allAnswers('a'), maxScores)
    expect(v.fire).toBe(1)
    expect(v.earth).toBe(0)
    expect(v.expr).toBe(1)
    expect(v.order).toBe(0)
    expect(v.water).toBeCloseTo(0.5, 6)
    expect(v.air).toBeCloseTo(11 / 17, 6)
  })

  it('all-B → extreme earth/order, zero fire/expr', () => {
    const v = score(items, allAnswers('b'), maxScores)
    expect(v.fire).toBe(0)
    expect(v.earth).toBe(1)
    expect(v.expr).toBe(0)
    expect(v.order).toBe(1)
  })

  it('unanswered questions contribute nothing', () => {
    const v = score(items, {}, maxScores)
    expect(Object.values(v).every((x) => x === 0)).toBe(true)
  })

  it('keeps every dim within [0,1] for a mixed run', () => {
    const v = score(items, Object.fromEntries(items.map((q, i) => [q.id, i % 2 ? 'a' : 'b'])), maxScores)
    for (const x of Object.values(v)) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
    }
  })
})

describe('dominant / missing / archetype', () => {
  const v: PersonalityVector = { fire: 0.9, earth: 0.2, air: 0.6, water: 0.1, expr: 0.7, order: 0.4 }
  it('orders dominant dims descending', () => expect(dominantDims(v, 2)).toEqual(['fire', 'expr']))
  it('orders missing dims ascending', () => expect(missingDims(v, 1)).toEqual(['water']))
  it('finds the dominant element', () => expect(dominantElement(v)).toBe('fire'))
  it('builds an archetype key (primary/secondary/missing)', () => {
    const k = archetypeKey(v)
    expect(k.primary).toBe('fire')
    expect(k.secondary).toBe('expr')
    expect(k.missing).toBe('water')
  })
})
