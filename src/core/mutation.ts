// AR-3 异变判定（design/02 §5.3, design/05）. Deviation of the measured vector
// from the age-adjusted baseline; older age lowers the threshold.
import type { Config, Dim, MutationLevel, MutationResult, PersonalityVector } from './types'
import { DIMS } from './types'
import { alphaForBand } from './age'
import { distance } from './vector'

const DRIVER_COUNT = 2

/** τ(age) = tauBase − beta·α(age). */
export function tauForBand(ageBand: number, config: Config): number {
  return config.mutation.tauBase - config.mutation.beta * alphaForBand(ageBand, config)
}

/** Per-dimension absolute deviation, dims sorted by descending deviation. */
export function deviationDrivers(v: PersonalityVector, effBaseline: PersonalityVector): Dim[] {
  return [...DIMS].sort((a, b) => Math.abs(v[b] - effBaseline[b]) - Math.abs(v[a] - effBaseline[a]))
}

export function detectMutation(
  v: PersonalityVector,
  effBaseline: PersonalityVector,
  ageBand: number,
  config: Config,
): MutationResult {
  const deviation = distance(v, effBaseline)
  const tau = tauForBand(ageBand, config)
  const isMutated = deviation > tau

  const [o1, o2] = config.mutation.levels
  let level: MutationLevel = 0
  if (isMutated) {
    if (deviation >= tau + o2) level = 3
    else if (deviation >= tau + o1) level = 2
    else level = 1
  }

  const drivers = deviationDrivers(v, effBaseline).slice(0, DRIVER_COUNT)
  return { isMutated, deviation, tau, level, drivers }
}
