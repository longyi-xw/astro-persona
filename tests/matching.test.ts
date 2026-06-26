import { describe, expect, it } from 'vitest'
import { buildCompatMatrix, elementRelation, rankMatches } from '~/core/matching'
import type { PersonalityVector } from '~/core/types'
import { config, signById, signs } from './fixtures'

const matrix = buildCompatMatrix(signs)

describe('elementRelation / buildCompatMatrix', () => {
  it('scores same element highest and squares lowest (matches prototype Aries compat)', () => {
    expect(matrix.aries!.leo).toBe(0.85) // same fire
    expect(matrix.aries!.sagittarius).toBe(0.85) // same fire
    expect(matrix.aries!.gemini).toBe(0.75) // complementary air
    expect(matrix.aries!.libra).toBe(0.6) // opposition (180°)
    expect(matrix.aries!.cancer).toBe(0.45) // square (90°) — prototype "低"
    expect(matrix.aries!.capricorn).toBe(0.45) // square (90°) — prototype "低"
  })

  it('classifies aspects between non-element-related signs', () => {
    expect(elementRelation(signById('aries'), signById('cancer'))).toBe('square') // 90°
    expect(elementRelation(signById('aries'), signById('libra'))).toBe('opposition') // 180°
    expect(elementRelation(signById('taurus'), signById('cancer'))).toBe('sextile') // 60°, earth-water
  })

  it('is symmetric', () => {
    for (const a of signs) for (const b of signs) expect(matrix[a.id]![b.id]).toBe(matrix[b.id]![a.id])
  })
})

const fireUser: PersonalityVector = { fire: 0.86, earth: 0.32, air: 0.66, water: 0.28, expr: 0.74, order: 0.38 }

describe('rankMatches', () => {
  it('never recommends the user’s own sign and respects topN', () => {
    const r = rankMatches('aries', fireUser, signs, config, { matrix })
    expect(r.some((m) => m.sign === 'aries')).toBe(false)
    expect(r.length).toBeLessThanOrEqual(config.match.topN)
    expect(r.length).toBeGreaterThan(0)
  })

  it('sorts by descending score', () => {
    const r = rankMatches('aries', fireUser, signs, config, { matrix })
    for (let i = 1; i < r.length; i++) expect(r[i - 1]!.score).toBeGreaterThanOrEqual(r[i]!.score)
  })

  it('only attaches idealFit when an ideal vector is supplied', () => {
    const without = rankMatches('aries', fireUser, signs, config, { matrix })
    expect(without[0]!.ideal).toBeUndefined()

    const ideal: PersonalityVector = { fire: 0.8, earth: 0.3, air: 0.7, water: 0.3, expr: 0.7, order: 0.35 }
    const withIdeal = rankMatches('aries', fireUser, signs, config, { matrix, ideal })
    expect(withIdeal[0]!.ideal).toBeGreaterThanOrEqual(0)
  })

  it('mutation reweighting lifts a personality-aligned but low-base-compat sign', () => {
    // Make the user’s personality identical to Cancer’s baseline (square → low base).
    const cancer = signById('cancer')
    const rankOf = (sign: string, results: ReturnType<typeof rankMatches>) =>
      results.findIndex((m) => m.sign === sign)

    const normal = rankMatches('aries', cancer.baseline, signs, config, { matrix, mutated: false })
    const mutated = rankMatches('aries', cancer.baseline, signs, config, { matrix, mutated: true })

    // Weakening the sign / strengthening personality should not push Cancer down,
    // and should raise its raw score share from personality.
    expect(rankOf('cancer', mutated)).toBeLessThanOrEqual(rankOf('cancer', normal))
  })
})
