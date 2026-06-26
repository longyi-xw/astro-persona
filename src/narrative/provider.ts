// 文案 Provider 接口（design/02 §8）. Business code depends only on this; the
// template impl is enabled this period, an LLM impl can be swapped in later
// with zero caller changes.
import type { Dim, ElementRelation, MutationLevel, PersonalityVector } from '~/core/types'
import type { Locale } from '~/data'

export interface NarrativeMatchItem {
  sign: string
  relation: ElementRelation
  similarDims: Dim[]
  complementDims: Dim[]
  idealFit?: number
}

export interface NarrativeContext {
  locale: Locale
  vector: PersonalityVector
  sign: string
  /** localized sign display name (for interpolation); falls back to id */
  signName?: string
  mutation?: { level: MutationLevel; dims: Dim[] }
  match?: NarrativeMatchItem[]
}

export interface Archetype {
  name: string
  latin: string
}

export interface NarrativeProvider {
  // deterministic, structured getters
  archetype(ctx: NarrativeContext): Archetype
  keywords(ctx: NarrativeContext): string[]
  matchReasons(ctx: NarrativeContext): string[]
  // generated prose (async to mirror a future LLM call)
  personalityCopy(ctx: NarrativeContext): Promise<string>
  mutationCopy(ctx: NarrativeContext): Promise<string>
  matchCopy(ctx: NarrativeContext): Promise<string>
}
