import { describe, expect, it } from 'vitest'
import { alphaForAge, alphaForBand, effectiveBaseline, neutralBaseline } from '~/core/age'
import { DIMS } from '~/core/types'
import { config, neutral, signById, signs } from './fixtures'

describe('neutralBaseline', () => {
  it('equals the component-wise mean of all baselines', () => {
    const n = neutralBaseline(signs)
    for (const d of DIMS) {
      const mean = signs.reduce((s, x) => s + x.baseline[d], 0) / signs.length
      expect(n[d]).toBeCloseTo(mean, 10)
    }
  })
  it('matches the loader-cached neutral', () => {
    const n = neutralBaseline(signs)
    for (const d of DIMS) expect(n[d]).toBeCloseTo(neutral[d], 3)
  })
})

describe('alphaForBand / alphaForAge', () => {
  it('reads alpha by band index', () => {
    expect(alphaForBand(0, config)).toBe(0.1)
    expect(alphaForBand(4, config)).toBe(0.65)
  })
  it('clamps out-of-range band indices', () => {
    expect(alphaForBand(-2, config)).toBe(0.1)
    expect(alphaForBand(99, config)).toBe(0.65)
  })
  it('increases monotonically with age band', () => {
    const a = config.age.breakpoints.map((_, i) => alphaForBand(i, config))
    for (let i = 1; i < a.length; i++) expect(a[i]!).toBeGreaterThan(a[i - 1]!)
  })
  it('resolves alpha from an actual age via maxAge thresholds', () => {
    expect(alphaForAge(15, config)).toBe(0.1)
    expect(alphaForAge(30, config)).toBe(0.35)
    expect(alphaForAge(80, config)).toBe(0.65)
  })
})

describe('effectiveBaseline', () => {
  const aries = signById('aries')
  const n = neutralBaseline(signs)
  it('blends sign baseline toward neutral by the band alpha', () => {
    const eff = effectiveBaseline(aries.baseline, n, 0, config)
    for (const d of DIMS) expect(eff[d]).toBeCloseTo(0.9 * aries.baseline[d] + 0.1 * n[d], 10)
  })
  it('drifts further toward neutral for older bands', () => {
    const young = effectiveBaseline(aries.baseline, n, 0, config)
    const old = effectiveBaseline(aries.baseline, n, 4, config)
    expect(Math.abs(old.fire - n.fire)).toBeLessThan(Math.abs(young.fire - n.fire))
  })
})
