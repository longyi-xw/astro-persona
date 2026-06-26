// AR-2 年龄加权（design/02 §5.2）. Older → baseline drifts toward the neutral
// individual, weakening the sign signal.
import type { Config, PersonalityVector, SignProfile } from './types'
import { lerp, meanVector } from './vector'

/** B_neutral = average of all sign baselines ("中性个体画像"). */
export function neutralBaseline(signs: SignProfile[]): PersonalityVector {
  return meanVector(signs.map((s) => s.baseline))
}

/** α for an age-band index (clamped to the configured bands). */
export function alphaForBand(ageBand: number, config: Config): number {
  const bands = config.age.bands
  if (bands.length === 0) return 0
  const i = Math.max(0, Math.min(bands.length - 1, Math.trunc(ageBand)))
  return bands[i]?.alpha ?? 0
}

/** B_eff = (1−α)·B_sign + α·B_neutral. */
export function effectiveBaseline(
  signBaseline: PersonalityVector,
  neutral: PersonalityVector,
  ageBand: number,
  config: Config,
): PersonalityVector {
  return lerp(signBaseline, neutral, alphaForBand(ageBand, config))
}
