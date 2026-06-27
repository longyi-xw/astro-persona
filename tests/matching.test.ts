import { describe, expect, it } from 'vitest'
import { rankMatches } from '~/core/matching'
import type { MatchResult, PersonalityVector } from '~/core/types'
import { compat, config, signById, signs } from './fixtures'

const aries = signById('aries').baseline

describe('rankMatches', () => {
  it('never recommends the user’s own sign, respects topN, sorts descending', () => {
    const r = rankMatches('aries', aries, signs, config, { compat })
    expect(r.some((m) => m.sign === 'aries')).toBe(false)
    expect(r.length).toBeGreaterThan(0)
    expect(r.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < r.length; i++) expect(r[i - 1]!.score).toBeGreaterThanOrEqual(r[i]!.score)
  })

  it('attaches idealFit only when an ideal vector is supplied', () => {
    expect(rankMatches('aries', aries, signs, config, { compat })[0]!.ideal).toBeUndefined()
    const withIdeal = rankMatches('aries', aries, signs, config, { compat, ideal: signById('leo').baseline })
    expect(withIdeal[0]!.ideal).toBeGreaterThanOrEqual(0)
  })

  it('flags same-element candidates in the explanation', () => {
    const r = rankMatches('aries', aries, signs, config, { compat, topN: 12 })
    expect(r.find((m) => m.sign === 'leo')?.explain.sameElement).toBe(true)
    expect(r.find((m) => m.sign === 'taurus')?.explain.sameElement).toBe(false)
  })

  it('mutation reweighting does not push a personality-aligned, low-base sign down', () => {
    const cancer = signById('cancer') // aries-cancer = square (low base compat)
    const rankOf = (sign: string, rs: MatchResult[]) => rs.findIndex((m) => m.sign === sign)
    const normal = rankMatches('aries', cancer.baseline, signs, config, { compat, mutated: false, topN: 12 })
    const mutated = rankMatches('aries', cancer.baseline, signs, config, { compat, mutated: true, topN: 12 })
    expect(rankOf('cancer', mutated)).toBeLessThanOrEqual(rankOf('cancer', normal))
  })
})

describe('match direction', () => {
  it('ranks a same-element high-compat sign above a square watery one for a fire user', () => {
    const user: PersonalityVector = { fire: 0.9, earth: 0.3, air: 0.5, water: 0.2, expr: 0.8, order: 0.35 }
    const r = rankMatches('aries', user, signs, config, { compat, topN: 12 })
    const scoreOf = (id: string) => r.find((m) => m.sign === id)?.score ?? 0
    expect(scoreOf('sagittarius')).toBeGreaterThan(scoreOf('cancer'))
  })
})
