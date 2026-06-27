// AR-2 年龄加权（design/02 §5.2, design/05）. Older → baseline drifts toward the
// neutral individual; α comes from config.age.breakpoints.
import type { Config, PersonalityVector, SignProfile } from './types'
import { lerp, meanVector } from './vector'

/** B_neutral = average of all sign baselines. */
export function neutralBaseline(signs: SignProfile[]): PersonalityVector {
  return meanVector(signs.map((s) => s.baseline))
}

/** α for an age-band index (the 5 bands align 1:1 with the 5 breakpoints). */
export function alphaForBand(ageBand: number, config: Config): number {
  const bps = config.age.breakpoints
  if (bps.length === 0) return 0
  const i = Math.max(0, Math.min(bps.length - 1, Math.trunc(ageBand)))
  return bps[i]?.alpha ?? 0
}

/** α for an actual age (first breakpoint whose maxAge ≥ age). */
export function alphaForAge(age: number, config: Config): number {
  for (const bp of config.age.breakpoints) if (age <= bp.maxAge) return bp.alpha
  return config.age.breakpoints[config.age.breakpoints.length - 1]?.alpha ?? 0
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
