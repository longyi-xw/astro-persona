import { describe, expect, it } from 'vitest'
import { alphaForBand, effectiveBaseline, neutralBaseline } from '~/core/age'
import { DIMS } from '~/core/types'
import { config, signById, signs } from './fixtures'

describe('neutralBaseline', () => {
  it('equals the component-wise mean of all sign baselines', () => {
    const n = neutralBaseline(signs)
    for (const d of DIMS) {
      const mean = signs.reduce((s, x) => s + x.baseline[d], 0) / signs.length
      expect(n[d]).toBeCloseTo(mean, 10)
    }
  })
})

describe('alphaForBand', () => {
  it('reads alpha by band index', () => {
    expect(alphaForBand(0, config)).toBe(0.1)
    expect(alphaForBand(4, config)).toBe(0.65)
  })
  it('clamps out-of-range indices', () => {
    expect(alphaForBand(-3, config)).toBe(0.1)
    expect(alphaForBand(99, config)).toBe(0.65)
  })
  it('increases monotonically with age band', () => {
    const alphas = config.age.bands.map((_, i) => alphaForBand(i, config))
    for (let i = 1; i < alphas.length; i++) expect(alphas[i]!).toBeGreaterThan(alphas[i - 1]!)
  })
})

describe('effectiveBaseline', () => {
  const aries = signById('aries')
  const neutral = neutralBaseline(signs)

  it('returns the sign baseline at the youngest band only blended by its alpha', () => {
    const eff = effectiveBaseline(aries.baseline, neutral, 0, config)
    for (const d of DIMS) {
      expect(eff[d]).toBeCloseTo(0.9 * aries.baseline[d] + 0.1 * neutral[d], 10)
    }
  })

  it('drifts further toward neutral for older bands', () => {
    const young = effectiveBaseline(aries.baseline, neutral, 0, config)
    const old = effectiveBaseline(aries.baseline, neutral, 4, config)
    // aries fire is above neutral, so older effective fire should be lower (closer to neutral)
    expect(old.fire).toBeLessThan(young.fire)
    expect(Math.abs(old.fire - neutral.fire)).toBeLessThan(Math.abs(young.fire - neutral.fire))
  })
})
