// AR-4 匹配评分（design/02 §5.4, design/05）. base = injected 12×12 compat;
// personality = similarity (simDims) + complement (compDims); + optional ideal;
// mutation reweights toward real personality. Pure: matrix injected.
import type { CompatMatrix, Config, Dim, MatchResult, MatchWeights, PersonalityVector, SignProfile } from './types'
import { cosine } from './vector'

const SIM_HIT = 0.72 // threshold for a dim to count as a "hit" in the explanation

function personalityFactor(
  user: PersonalityVector,
  candidate: PersonalityVector,
  config: Config,
): { value: number; similarDims: Dim[]; complementDims: Dim[] } {
  const p = config.match.personality
  const sim = (d: Dim) => 1 - Math.abs(user[d] - candidate[d])
  const comp = (d: Dim) => 1 - Math.abs(user[d] + candidate[d] - 1)

  const similarity = p.simDims.length ? p.simDims.reduce((s, d) => s + sim(d), 0) / p.simDims.length : 0
  const complement = p.compDims.length ? p.compDims.reduce((s, d) => s + comp(d), 0) / p.compDims.length : 0

  return {
    value: p.wSim * similarity + p.wComp * complement,
    similarDims: p.simDims.filter((d) => sim(d) >= SIM_HIT),
    complementDims: p.compDims.filter((d) => comp(d) >= SIM_HIT),
  }
}

/** Normalize weights to sum 1 (guards drift after mutation reweighting). */
function normalize(w: MatchWeights): MatchWeights {
  const sum = w.w1 + w.w2 + w.w3
  if (sum <= 0) return w
  return { w1: w.w1 / sum, w2: w.w2 / sum, w3: w.w3 / sum }
}

export interface RankOptions {
  compat: CompatMatrix
  ideal?: PersonalityVector | null
  mutated?: boolean
  topN?: number
}

/**
 * Rank candidate signs for a user (excludes the user's own sign).
 * score(B) = w1·base + w2·personality + w3·idealFit.
 */
export function rankMatches(
  userSign: string,
  user: PersonalityVector,
  candidates: SignProfile[],
  config: Config,
  opts: RankOptions,
): MatchResult[] {
  const hasIdeal = !!opts.ideal
  let weights: MatchWeights = { ...(hasIdeal ? config.match.withIdeal : config.match.base) }

  if (opts.mutated) {
    // 弱化星座、强化真实人格：reduced w1 folds into w2.
    const reduced = weights.w1 * config.match.mutationMultiplier
    const delta = weights.w1 - reduced
    weights = { w1: reduced, w2: weights.w2 + delta, w3: weights.w3 }
  }
  weights = normalize(weights)

  const userProfile = candidates.find((s) => s.id === userSign)

  const results: MatchResult[] = []
  for (const cand of candidates) {
    if (cand.id === userSign) continue
    const base = opts.compat[userSign]?.[cand.id] ?? 0
    const pf = personalityFactor(user, cand.baseline, config)
    const idealFit = opts.ideal ? Math.max(0, cosine(opts.ideal, cand.baseline)) : undefined

    const score = weights.w1 * base + weights.w2 * pf.value + weights.w3 * (idealFit ?? 0)

    results.push({
      sign: cand.id,
      score,
      base,
      personality: pf.value,
      ideal: idealFit,
      explain: {
        sameElement: !!userProfile && userProfile.element === cand.element,
        element: cand.element,
        similarDims: pf.similarDims,
        complementDims: pf.complementDims,
        idealFit,
      },
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, opts.topN ?? 5)
}
