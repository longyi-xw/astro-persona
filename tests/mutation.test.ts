import { describe, expect, it } from 'vitest'
import { detectMutation, tauFor } from '~/core/mutation'
import type { PersonalityVector } from '~/core/types'
import { config } from './fixtures'

const base: PersonalityVector = { fire: 0.5, earth: 0.5, air: 0.5, water: 0.5, expr: 0.5, order: 0.5 }

describe('tauFor', () => {
  it('decreases as age band rises (older → easier to mutate)', () => {
    expect(tauFor(4, config)).toBeLessThan(tauFor(0, config))
  })
  it('matches tauBase − beta·alpha', () => {
    expect(tauFor(0, config)).toBeCloseTo(config.mutation.tauBase - config.mutation.beta * 0.1, 10)
  })
})

describe('detectMutation', () => {
  it('reports no mutation and zero deviation when vector equals baseline', () => {
    const r = detectMutation(base, base, 2, config)
    expect(r.deviation).toBe(0)
    expect(r.isMutated).toBe(false)
    expect(r.level).toBe(0)
  })

  it('flags mutation when deviation exceeds the threshold', () => {
    const far: PersonalityVector = { fire: 1, earth: 0, air: 1, water: 0, expr: 1, order: 0 }
    const r = detectMutation(far, base, 2, config)
    expect(r.isMutated).toBe(true)
    expect(r.level).toBeGreaterThanOrEqual(1)
    expect(r.deviation).toBeGreaterThan(r.tau)
  })

  it('escalates level with the configured offsets', () => {
    const [o1, o2] = config.mutation.levelOffsets
    const tau = tauFor(2, config)
    // craft a single-dim deviation to hit a target normalized distance D = diff/sqrt(6)
    const atDistance = (D: number): PersonalityVector => ({ ...base, fire: 0.5 + D * Math.sqrt(6) })
    expect(detectMutation(atDistance(tau + o1 / 2), base, 2, config).level).toBe(1)
    expect(detectMutation(atDistance(tau + o1 + o1 / 2), base, 2, config).level).toBe(2)
    expect(detectMutation(atDistance(tau + o2 + 0.02), base, 2, config).level).toBe(3)
  })

  it('names the biggest-deviation dim as the first driver', () => {
    const v: PersonalityVector = { ...base, water: 0.95 }
    const r = detectMutation(v, base, 2, config)
    expect(r.drivers[0]).toBe('water')
    expect(r.drivers).toHaveLength(config.mutation.driverCount)
  })
})
