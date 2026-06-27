// AR-1 人格打分（design/02 §5.1, design/05）. Pure: items + answers + maxScores in.
import type { AnswerMap, Dim, Element, PersonalityVector, QuestionItem } from './types'
import { DIMS, ELEMENTS } from './types'
import { clamp01, zeroRecord } from './vector'

/**
 * Score answers into a normalized six-dim vector.
 * raw[d] = Σ(chosen option weights[d]); v[d] = raw[d] / maxScores[d].
 * Weights are non-negative; a missing dim contributes 0 (so consistently
 * introverted/chaotic answers push expr/order toward 0). maxScores must be the
 * per-dim theoretical max (computeMaxScores) so the result lands in [0,1].
 */
export function score(items: QuestionItem[], answers: AnswerMap, maxScores: Record<Dim, number>): PersonalityVector {
  const raw = zeroRecord()
  for (const q of items) {
    const chosenId = answers[q.id]
    if (chosenId === undefined) continue
    const chosen = q.options.find((o) => o.id === chosenId)
    if (!chosen) continue
    for (const d of DIMS) raw[d] += chosen.weights[d] ?? 0
  }
  const v = {} as PersonalityVector
  for (const d of DIMS) v[d] = maxScores[d] > 0 ? clamp01(raw[d] / maxScores[d]) : 0
  return v
}

/** Dims sorted by descending value; top-n dominant dims. */
export function dominantDims(v: PersonalityVector, n = 2): Dim[] {
  return [...DIMS].sort((a, b) => v[b] - v[a]).slice(0, n)
}

/** Dims sorted by ascending value; bottom-n missing dims. */
export function missingDims(v: PersonalityVector, n = 1): Dim[] {
  return [...DIMS].sort((a, b) => v[a] - v[b]).slice(0, n)
}

/** Strongest of the four element energies (drives the archetype family). */
export function dominantElement(v: PersonalityVector): Element {
  return ELEMENTS.reduce((best, e) => (v[e] > v[best] ? e : best), ELEMENTS[0])
}

/**
 * Stable archetype key: top dominant dim (+ secondary) + leading missing dim.
 * The narrative layer maps this to a named archetype (design/05 §C0). Core only
 * decides the combination; never emits a four-letter code.
 */
export function archetypeKey(v: PersonalityVector): { primary: Dim; secondary: Dim; missing: Dim } {
  const [primary, secondary] = dominantDims(v, 2)
  const missing = missingDims(v, 1)[0] ?? 'water'
  return { primary: primary ?? 'fire', secondary: secondary ?? 'earth', missing }
}
