// Pure vector math over the six personality dimensions. No framework/DOM.
import type { Dim, PersonalityVector } from './types'
import { DIMS } from './types'

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))

const zeroRecord = (): Record<Dim, number> => ({ fire: 0, earth: 0, air: 0, water: 0, expr: 0, order: 0 })

/** Neutral midpoint vector (all dims 0.5). */
export const midVector = (): PersonalityVector => ({ fire: 0.5, earth: 0.5, air: 0.5, water: 0.5, expr: 0.5, order: 0.5 })

/** Normalized Euclidean distance over 6 dims → [0,1] (design/02 §5.3). */
export function distance(a: PersonalityVector, b: PersonalityVector): number {
  let sum = 0
  for (const d of DIMS) {
    const diff = a[d] - b[d]
    sum += diff * diff
  }
  return Math.sqrt(sum) / Math.sqrt(DIMS.length)
}

/** Cosine similarity → [-1,1] (used for ideal-type fit). */
export function cosine(a: PersonalityVector, b: PersonalityVector): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const d of DIMS) {
    dot += a[d] * b[d]
    na += a[d] * a[d]
    nb += b[d] * b[d]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Linear interpolation a→b by t∈[0,1], per dimension. */
export function lerp(a: PersonalityVector, b: PersonalityVector, t: number): PersonalityVector {
  const out = {} as PersonalityVector
  for (const d of DIMS) out[d] = a[d] * (1 - t) + b[d] * t
  return out
}

/** Component-wise mean of vectors (empty → mid vector). */
export function meanVector(vs: PersonalityVector[]): PersonalityVector {
  if (vs.length === 0) return midVector()
  const acc = zeroRecord()
  for (const v of vs) for (const d of DIMS) acc[d] += v[d]
  const out = {} as PersonalityVector
  for (const d of DIMS) out[d] = acc[d] / vs.length
  return out
}

export { zeroRecord }
