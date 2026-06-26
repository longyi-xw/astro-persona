// AR-1 人格打分（design/02 §5.1）. Pure: questions + answers in, vector out.
import type { AnswerMap, Dim, Element, PersonalityVector, Question } from './types'
import { DIMS, ELEMENTS } from './types'
import { clamp01, zeroRecord } from './vector'

/**
 * Score answers into a normalized six-dim vector.
 * Each dim is min–max normalized against the theoretical range of the
 * *answered* questions, so quick (12q) and full (20q) tiers both map to [0,1]
 * and weights may be negative.
 */
export function score(questions: Question[], answers: AnswerMap): PersonalityVector {
  const raw = zeroRecord()
  const min = zeroRecord()
  const max = zeroRecord()

  for (const q of questions) {
    const chosenId = answers[q.id]
    if (chosenId === undefined) continue // only answered questions contribute

    for (const d of DIMS) {
      let lo = Infinity
      let hi = -Infinity
      for (const opt of q.options) {
        const w = opt.weights[d] ?? 0
        if (w < lo) lo = w
        if (w > hi) hi = w
      }
      min[d] += lo
      max[d] += hi
    }

    const chosen = q.options.find((o) => o.id === chosenId)
    if (chosen) for (const d of DIMS) raw[d] += chosen.weights[d] ?? 0
  }

  const v = {} as PersonalityVector
  for (const d of DIMS) {
    const span = max[d] - min[d]
    v[d] = span <= 0 ? 0.5 : clamp01((raw[d] - min[d]) / span)
  }
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
 * Stable archetype key: dominant element + top dominant axis (expr/order) +
 * leading missing dim. The narrative layer maps this to a named archetype;
 * core only decides the combination (design/02 §5.1, "不输出四字母代码").
 */
export function archetypeKey(v: PersonalityVector): { element: Element; dominant: Dim[]; missing: Dim } {
  const dominant = dominantDims(v, 2)
  const missing = missingDims(v, 1)[0] ?? 'water'
  return { element: dominantElement(v), dominant, missing }
}
