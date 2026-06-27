// Data types are owned by content.schema (zod source of truth); re-export them
// here so the rest of core imports from one place. This file adds the
// algorithm-only result types.
import type { Dim, Element, PersonalityVector } from './content.schema'

export type {
  Dim,
  Element,
  Modality,
  PersonalityVector,
  SignProfile,
  SignContent,
  QuestionItem,
  Config,
  MatchWeights,
  CompatMatrix,
} from './content.schema'
export { DIMS, ELEMENTS, MODALITIES } from './content.schema'

/** 一次作答：题 id → 选中的选项 id。 */
export type AnswerMap = Record<string, string>

/** 异变等级：0 典型 / 1 微异 / 2 显异 / 3 极异。 */
export type MutationLevel = 0 | 1 | 2 | 3

export interface MutationResult {
  isMutated: boolean
  deviation: number // 归一化欧氏距离 D ∈ [0,1]
  tau: number // 该年龄段阈值
  level: MutationLevel
  drivers: Dim[] // 偏离最大的维度（可解释）
}

export interface MatchExplain {
  sameElement: boolean
  element: Element // 候选星座元素（用于"{element}象同频"）
  similarDims: Dim[] // 命中的相似维
  complementDims: Dim[] // 命中的互补维
  idealFit?: number // 理想型契合度（仅当提供理想型）
}

export interface MatchResult {
  sign: string
  score: number // 0..1
  base: number
  personality: number
  ideal?: number
  explain: MatchExplain
}

/** 结果状态：紧凑序列化进 URL 以复现（无 PII）。 */
export interface ResultState {
  v: PersonalityVector
  sign: string
  ageBand: number // 年龄段索引（非精确生日）
  mutated?: { level: MutationLevel; dims: Dim[] }
  ideal?: PersonalityVector
}
