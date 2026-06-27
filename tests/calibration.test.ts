import { describe, expect, it } from 'vitest'
import { effectiveBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { clamp01 } from '~/core/vector'
import { DIMS, type PersonalityVector, type SignProfile } from '~/core/types'
import { config, makeRng, neutral, signs } from './fixtures'

// Synthetic population (design/05 §A5): ~70% "typical" people = sign baseline +
// Gaussian noise; ~30% "outliers" = uniform random with a random sun sign. Each
// sample gets a random age band. N ≥ 2000.
const K = 180 // 12 × 180 = 2160
const rng = makeRng(0xA57201)
const gauss = () => {
  const u = Math.max(1e-9, rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

interface Sample { sign: SignProfile; v: PersonalityVector; band: number }
function buildPopulation(): Sample[] {
  const pop: Sample[] = []
  for (const sign of signs) {
    for (let k = 0; k < K; k++) {
      const typical = rng() < 0.7
      const v = {} as PersonalityVector
      if (typical) for (const d of DIMS) v[d] = clamp01(sign.baseline[d] + gauss() * 0.12)
      else for (const d of DIMS) v[d] = rng()
      const assigned = typical ? sign : signs[Math.floor(rng() * signs.length)]!
      pop.push({ sign: assigned, v, band: Math.floor(rng() * config.age.breakpoints.length) })
    }
  }
  return pop
}
const population = buildPopulation()

const isMutated = (s: Sample, band = s.band) =>
  detectMutation(s.v, effectiveBaseline(s.sign.baseline, neutral, band, config), band, config).isMutated

const rateAtBand = (band: number) => population.filter((s) => isMutated(s, band)).length / population.length
const overall = population.filter((s) => isMutated(s)).length / population.length

describe('mutation-rate calibration (SRS FR-4.4)', () => {
  it(`N=${population.length}; overall mutation rate within 15%–30% (got ${(overall * 100).toFixed(1)}%; by band ${config.age.breakpoints
    .map((_, i) => (rateAtBand(i) * 100).toFixed(0) + '%')
    .join(', ')})`, () => {
    expect(population.length).toBeGreaterThanOrEqual(2000)
    expect(overall).toBeGreaterThanOrEqual(0.15)
    expect(overall).toBeLessThanOrEqual(0.3)
  })

  it('older bands mutate at least as often as younger ones', () => {
    const rates = config.age.breakpoints.map((_, i) => rateAtBand(i))
    expect(rates[rates.length - 1]!).toBeGreaterThanOrEqual(rates[0]!)
  })

  it('never collapses to everyone or no one', () => {
    for (let i = 0; i < config.age.breakpoints.length; i++) {
      const r = rateAtBand(i)
      expect(r).toBeGreaterThan(0.02)
      expect(r).toBeLessThan(0.7)
    }
  })
})
