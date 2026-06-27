// 文案 Provider 接口（design/02 §8, design/05 §C0）. Business code depends only on
// this; the template impl is enabled, an LLM impl can be swapped in later.
import type { Dim, Element, MutationLevel, PersonalityVector } from '~/core/types'
import type { Locale } from '~/content'

export interface NarrativeMatchItem {
  sign: string
  sameElement: boolean
  element: Element
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
  name: string // localized
  latin: string // English (for the bilingual subtitle)
  blurb: string
}

export interface NarrativeProvider {
  archetype(ctx: NarrativeContext): Archetype
  keywords(ctx: NarrativeContext): string[]
  matchReasons(ctx: NarrativeContext): string[]
  personalityCopy(ctx: NarrativeContext): Promise<string>
  mutationCopy(ctx: NarrativeContext): Promise<string>
  matchCopy(ctx: NarrativeContext): Promise<string>
}
