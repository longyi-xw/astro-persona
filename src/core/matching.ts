// AR-4 匹配评分（design/02 §5.4）. base element compatibility + personality
// (similarity & complement) + optional ideal-type; mutation reweights toward
// real personality.
import type {
  CompatMatrix,
  CompatRules,
  Config,
  Dim,
  ElementRelation,
  MatchResult,
  MatchWeights,
  PersonalityVector,
  SignProfile,
} from './types'
import { cosine } from './vector'

const ZODIAC_ORDER = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const

export const DEFAULT_COMPAT_RULES: CompatRules = {
  same: 0.85, // conjunction / trine (same element)
  sextile: 0.75, // 60° — complementary elements, harmonious
  square: 0.45, // 90° — incompatible elements, tension
  opposition: 0.6, // 180° — complementary but polar
  neutral: 0.55, // 30° / 150°
}

/**
 * Classify two signs by their zodiacal aspect (30°-per-sign separation).
 * Element relations fall out of the geometry: trine ⇒ same element,
 * sextile/opposition ⇒ complementary elements, square ⇒ incompatible.
 */
export function elementRelation(a: SignProfile, b: SignProfile): ElementRelation {
  if (a.id === b.id) return 'same'
  const ia = ZODIAC_ORDER.indexOf(a.id as (typeof ZODIAC_ORDER)[number])
  const ib = ZODIAC_ORDER.indexOf(b.id as (typeof ZODIAC_ORDER)[number])
  if (ia < 0 || ib < 0) return 'neutral'
  const steps = Math.min(Math.abs(ia - ib), ZODIAC_ORDER.length - Math.abs(ia - ib)) // 0..6
  switch (steps) {
    case 2:
      return 'sextile' // 60°
    case 3:
      return 'square' // 90°
    case 4:
      return 'same' // 120° trine (same element)
    case 6:
      return 'opposition' // 180°
    default:
      return 'neutral' // 30° / 150°
  }
}

/** Build the 12×12 base-compatibility matrix from element/aspect rules. */
export function buildCompatMatrix(signs: SignProfile[], rules: CompatRules = DEFAULT_COMPAT_RULES): CompatMatrix {
  const matrix: CompatMatrix = {}
  for (const a of signs) {
    const row: Record<string, number> = {}
    for (const b of signs) {
      row[b.id] = a.id === b.id ? rules.same : rules[elementRelation(a, b)]
    }
    matrix[a.id] = row
  }
  return matrix
}

const SIM_HIT = 0.72 // threshold for a dim to count as a "hit" in the explanation

function personalityFactor(
  user: PersonalityVector,
  candidate: PersonalityVector,
  config: Config,
): { value: number; similarDims: Dim[]; complementDims: Dim[] } {
  const sim = (d: Dim) => 1 - Math.abs(user[d] - candidate[d])
  const comp = (d: Dim) => 1 - Math.abs(user[d] + candidate[d] - 1)

  const simDims = config.match.similarityDims
  const compDims = config.match.complementDims
  const similarity = simDims.length ? simDims.reduce((s, d) => s + sim(d), 0) / simDims.length : 0
  const complement = compDims.length ? compDims.reduce((s, d) => s + comp(d), 0) / compDims.length : 0

  return {
    value: config.match.wSim * similarity + config.match.wComp * complement,
    similarDims: simDims.filter((d) => sim(d) >= SIM_HIT),
    complementDims: compDims.filter((d) => comp(d) >= SIM_HIT),
  }
}

/** Normalize weights to sum 1 (guards against drift after mutation reweighting). */
function normalize(w: MatchWeights): MatchWeights {
  const sum = w.w1 + w.w2 + w.w3
  if (sum <= 0) return w
  return { w1: w.w1 / sum, w2: w.w2 / sum, w3: w.w3 / sum }
}

export interface RankOptions {
  matrix: CompatMatrix
  ideal?: PersonalityVector | null
  mutated?: boolean
}

/**
 * Rank candidate signs for a user. Excludes the user's own sign.
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
  let weights: MatchWeights = { ...(hasIdeal ? config.match.withIdeal : config.match.withoutIdeal) }

  if (opts.mutated) {
    // 弱化星座、强化真实人格：reduced w1 folds into w2.
    const reduced = weights.w1 * config.match.mutationMultiplier
    const delta = weights.w1 - reduced
    weights = { w1: reduced, w2: weights.w2 + delta, w3: weights.w3 }
  }
  weights = normalize(weights)

  const byId = (id: string): SignProfile | undefined => candidates.find((s) => s.id === id)
  const userProfile = byId(userSign)

  const results: MatchResult[] = []
  for (const cand of candidates) {
    if (cand.id === userSign) continue
    const base = opts.matrix[userSign]?.[cand.id] ?? DEFAULT_COMPAT_RULES.neutral
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
        relation: userProfile ? elementRelation(userProfile, cand) : 'neutral',
        similarDims: pf.similarDims,
        complementDims: pf.complementDims,
        idealFit,
      },
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, config.match.topN)
}
