// Typed bridge between version-controlled content JSON and the pure core.
// The core never imports content; this layer injects it.
import type {
  CompatMatrix,
  Config,
  Dim,
  Element,
  ElementRelation,
  PersonalityVector,
  Question,
  SignProfile,
} from '~/core/types'
import { neutralBaseline } from '~/core/age'
import { buildCompatMatrix } from '~/core/matching'

import profilesJson from '~~/content/signs/profiles.json'
import questionWeights from '~~/content/questions/weights.json'
import configJson from '~~/content/config/weights.json'
import signsZh from '~~/content/signs/zh.json'
import signsEn from '~~/content/signs/en.json'
import questionsZh from '~~/content/questions/zh.json'
import questionsEn from '~~/content/questions/en.json'
import copyZh from '~~/content/copy/zh.json'
import copyEn from '~~/content/copy/en.json'

export type Locale = 'zh' | 'en'

export interface SignText {
  name: string
  keyword: string
  sketch: string[]
  love: string
  work: string
}
export interface QuestionText {
  scenario: string
  options: Record<string, string>
}
export interface CopyBundle {
  archetypes: Record<Element, { name: string; latin: string }>
  dims: Record<Dim, string>
  dimsFull: Record<Dim, string>
  keywords: Record<Dim, string[]>
  mutationLabel: Record<'0' | '1' | '2' | '3', string>
  mutation: Record<'0' | '1' | '2' | '3', string>
  relation: Record<ElementRelation, string>
  connectors: {
    similar: string
    complement: string
    and: string
    idealHigh: string
    idealMid: string
    listSep: string
  }
  personality: string
  matchSummary: string
}

// language-neutral data → typed
export const signs = (profilesJson as unknown as { signs: SignProfile[] }).signs
export const questions = (questionWeights as unknown as { questions: Question[] }).questions
export const config = configJson as unknown as Config
export const compatMatrix: CompatMatrix = buildCompatMatrix(signs)
export const neutral: PersonalityVector = neutralBaseline(signs)

// locale display text
const signTextByLocale: Record<Locale, Record<string, SignText>> = {
  zh: signsZh as unknown as Record<string, SignText>,
  en: signsEn as unknown as Record<string, SignText>,
}
const questionTextByLocale: Record<Locale, Record<string, QuestionText>> = {
  zh: questionsZh as unknown as Record<string, QuestionText>,
  en: questionsEn as unknown as Record<string, QuestionText>,
}
export const copyBundles: Record<Locale, CopyBundle> = {
  zh: copyZh as unknown as CopyBundle,
  en: copyEn as unknown as CopyBundle,
}

export const signIds: string[] = signs.map((s) => s.id)
export const signById = (id: string): SignProfile | undefined => signs.find((s) => s.id === id)
export const elementOf = (id: string): Element | undefined => signById(id)?.element
export const signText = (locale: Locale, id: string): SignText | undefined => signTextByLocale[locale][id]
export const questionText = (locale: Locale, id: string): QuestionText | undefined => questionTextByLocale[locale][id]
export const questionsForTier = (tier: 'quick' | 'full'): Question[] =>
  tier === 'full' ? questions : questions.filter((q) => q.tier === 'quick')
