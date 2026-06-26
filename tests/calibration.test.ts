import { describe, expect, it } from 'vitest'
import { effectiveBaseline, neutralBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { buildCompatMatrix, rankMatches } from '~/core/matching'
import { lerp } from '~/core/vector'
import { DIMS, type PersonalityVector, type SignProfile } from '~/core/types'
import { config, makeRng, signById, signs } from './fixtures'

// Synthetic population: each person is their sign baseline pulled toward a
// random vector by a uniform drift∈[0,0.7) — models that real individuals
// deviate from the archetype by varying degrees. Fixed across age bands so the
// age effect can be isolated.
const K = 60
function buildPopulation(): { sign: SignProfile; v: PersonalityVector }[] {
  const rng = makeRng(0xC0FFEE)
  const pop: { sign: SignProfile; v: PersonalityVector }[] = []
  for (const sign of signs) {
    for (let k = 0; k < K; k++) {
      const drift = rng() * 0.7
      const randv = {} as PersonalityVector
      for (const d of DIMS) randv[d] = rng()
      pop.push({ sign, v: lerp(sign.baseline, randv, drift) })
    }
  }
  return pop
}

const population = buildPopulation()
const neutral = neutralBaseline(signs)

function mutationRateAtBand(band: number): number {
  let mutated = 0
  for (const p of population) {
    const eff = effectiveBaseline(p.sign.baseline, neutral, band, config)
    if (detectMutation(p.v, eff, band, config).isMutated) mutated++
  }
  return mutated / population.length
}

describe('mutation-rate calibration (SRS FR-4.4)', () => {
  const rates = config.age.bands.map((_, i) => mutationRateAtBand(i))
  const overall = rates.reduce((s, r) => s + r, 0) / rates.length

  it(`overall mutation rate stays within 15%–30% (got ${(overall * 100).toFixed(1)}%; per-band ${rates
    .map((r) => (r * 100).toFixed(0) + '%')
    .join(', ')})`, () => {
    expect(overall).toBeGreaterThanOrEqual(0.15)
    expect(overall).toBeLessThanOrEqual(0.3)
  })

  it('older bands mutate at least as often as younger ones', () => {
    expect(rates[rates.length - 1]!).toBeGreaterThanOrEqual(rates[0]!)
  })

  it('never collapses to "everyone" or "no one"', () => {
    for (const r of rates) {
      expect(r).toBeGreaterThan(0.02)
      expect(r).toBeLessThan(0.6)
    }
  })
})

describe('match ordering direction', () => {
  const matrix = buildCompatMatrix(signs)

  it('ranks an aligned candidate above an opposed one for the same user', () => {
    // A textbook Aries-like user: fire/expr high, water/order low.
    const user: PersonalityVector = { fire: 0.85, earth: 0.4, air: 0.6, water: 0.3, expr: 0.75, order: 0.4 }
    const results = rankMatches('aries', user, signs, config, { matrix })
    const scoreOf = (id: string) => results.find((m) => m.sign === id)?.score ?? 0
    // Sagittarius (same fire) should out-score Cancer (square, watery) for this user.
    expect(scoreOf('sagittarius')).toBeGreaterThan(scoreOf('cancer'))
  })

  it('ideal-type input narrows toward the ideal (raises an ideal-matching sign’s rank)', () => {
    const user: PersonalityVector = signById('aries').baseline
    const idealLikeAquarius = signById('aquarius').baseline
    const base = rankMatches('aries', user, signs, config, { matrix })
    const withIdeal = rankMatches('aries', user, signs, config, { matrix, ideal: idealLikeAquarius })
    const rankOf = (rs: typeof base, id: string) => rs.findIndex((m) => m.sign === id)
    // Aquarius should not rank worse once the ideal points at it.
    expect(rankOf(withIdeal, 'aquarius')).toBeLessThanOrEqual(rankOf(base, 'aquarius'))
  })
})
