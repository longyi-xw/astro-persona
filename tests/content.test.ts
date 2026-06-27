import { describe, expect, it } from 'vitest'
import { validateContent } from '~/core/content.schema'
import { getCompat, getCompatMatrix, getConfig, getMaxScores, getNeutral, getQuestionItems, getSignIds } from '~/content'

import profiles from '~~/content/signs/profiles.json'
import signZh from '~~/content/signs/zh.json'
import signEn from '~~/content/signs/en.json'
import items from '~~/content/questions/items.json'
import qZh from '~~/content/questions/zh.json'
import qEn from '~~/content/questions/en.json'
import config from '~~/content/config/weights.json'
import compat from '~~/content/config/compat-matrix.json'
import copyZh from '~~/content/copy/zh.json'
import copyEn from '~~/content/copy/en.json'

describe('validateContent', () => {
  it('passes schema + cross-file id alignment for all files', () => {
    expect(() => validateContent({ profiles, signZh, signEn, items, qZh, qEn, config, compat, copyZh, copyEn })).not.toThrow()
  })
})

describe('derived values (lock against drift)', () => {
  it('maxScores matches the README reference', () => {
    expect(getMaxScores()).toEqual({ fire: 17, earth: 18, air: 17, water: 14, expr: 11, order: 23 })
  })

  it('neutral ≈ {.53,.49,.55,.52,.58,.53}', () => {
    const n = getNeutral()
    expect(n.fire).toBeCloseTo(0.53, 2)
    expect(n.earth).toBeCloseTo(0.49, 2)
    expect(n.air).toBeCloseTo(0.55, 2)
    expect(n.water).toBeCloseTo(0.52, 2)
    expect(n.expr).toBeCloseTo(0.58, 2)
    expect(n.order).toBeCloseTo(0.53, 2)
  })

  it('ships 16 questions', () => {
    expect(getQuestionItems()).toHaveLength(16)
  })
})

describe('compat matrix', () => {
  const m = getCompatMatrix()
  const ids = getSignIds()

  it('is 12×12 with every sign id', () => {
    expect(ids).toHaveLength(12)
    expect(Object.keys(m).sort()).toEqual([...ids].sort())
    for (const a of ids) expect(Object.keys(m[a]!).sort()).toEqual([...ids].sort())
  })

  it('is symmetric and within [0,1]', () => {
    for (const a of ids)
      for (const b of ids) {
        expect(m[a]![b]).toBe(m[b]![a])
        expect(m[a]![b]).toBeGreaterThanOrEqual(0)
        expect(m[a]![b]).toBeLessThanOrEqual(1)
      }
  })

  it('maps the v2 distance table (trine .85, sextile .75, opposition .60, square .45, same sign .70)', () => {
    expect(getCompat('aries', 'leo')).toBe(0.85)
    expect(getCompat('aries', 'gemini')).toBe(0.75)
    expect(getCompat('aries', 'libra')).toBe(0.6)
    expect(getCompat('aries', 'cancer')).toBe(0.45)
    expect(getCompat('aries', 'aries')).toBe(0.7)
  })
})

describe('config', () => {
  it('exposes age breakpoints, mutation params, and match weights', () => {
    const c = getConfig()
    expect(c.age.breakpoints).toHaveLength(5)
    expect(c.mutation.tauBase).toBeGreaterThan(0)
    expect(c.match.personality.simDims).toEqual(['earth', 'water', 'order'])
  })
})
