// Shared types & schema for the pure algorithm core (design/02 §4).
// No framework / DOM / content imports — everything is injected as parameters.

/** 六维人格向量：四象能量 + 两条极性轴，均归一化到 [0,1]。 */
export interface PersonalityVector {
  fire: number // 行动/热情/外驱
  earth: number // 务实/秩序/稳定
  air: number // 思辨/社交/求新
  water: number // 情感/直觉/共情
  expr: number // 极性轴：内显(0)↔外显(1)
  order: number // 极性轴：混沌(0)↔守序(1)
}
export type Dim = keyof PersonalityVector
export const DIMS: readonly Dim[] = ['fire', 'earth', 'air', 'water', 'expr', 'order'] as const
export const ELEMENTS = ['fire', 'earth', 'air', 'water'] as const

export type Element = (typeof ELEMENTS)[number]
export type Modality = 'cardinal' | 'fixed' | 'mutable' // 三态：启动/固定/变动

export interface SignProfile {
  id: string // 'aries' …
  element: Element
  modality: Modality
  ruler: string // i18n key for the ruling planet
  glyph: string // zodiac symbol (text-variation forced at render)
  dates: { from: string; to: string } // 'MM.DD'
  baseline: PersonalityVector // 共识基线（提炼自多家来源），与语言无关
}

export interface QuestionOption {
  id: string
  weights: Partial<Record<Dim, number>> // 该选项对各维度的加权（可正可负）
}
export interface Question {
  id: string
  tier: 'quick' | 'full' // quick⊂full：quick 题也属于 full
  options: QuestionOption[] // 题面/选项文案在 i18n / content 中按 id 取
}

/** 一次作答：题 id → 选中的选项 id。 */
export type AnswerMap = Record<string, string>

export interface MatchWeights {
  w1: number // 基础元素相性
  w2: number // 人格补充因子
  w3: number // 理想型契合度
}

export interface AgeBand {
  id: string // '<18' | '18-25' | …
  alpha: number // 星座信号衰减系数（越大越衰减）
}

export interface Config {
  age: { bands: AgeBand[] }
  mutation: {
    tauBase: number // 默认 0.40
    beta: number // 默认 0.15，年龄阈值斜率
    levelOffsets: [number, number] // [0.1, 0.2] → 微异/显异/极异 边界
    driverCount: number // 解释展示的主导偏离维数量
  }
  match: {
    withIdeal: MatchWeights // 默认 (0.5,0.3,0.2)
    withoutIdeal: MatchWeights // 默认 (0.6,0.4,0)
    mutationMultiplier: number // 默认 0.6，异变时 w1 乘子
    wSim: number // 相似度权重，默认 0.5
    wComp: number // 互补度权重，默认 0.5
    similarityDims: Dim[] // 价值观/生活方式宜相似：earth, water, order
    complementDims: Dim[] // 能量宜互补：fire, water, expr
    topN: number // 输出推荐数
  }
}

// Aspect-based: same = conjunction(same sign) or trine(same element);
// sextile/opposition are both complementary-element but differ by angle;
// square = incompatible elements; neutral = semisextile/quincunx.
export type ElementRelation = 'same' | 'sextile' | 'square' | 'opposition' | 'neutral'

export interface CompatRules {
  same: number
  sextile: number
  square: number
  opposition: number
  neutral: number
}
/** 12×12 元素相性矩阵：matrix[a][b] ∈ [0,1]。 */
export type CompatMatrix = Record<string, Record<string, number>>

/** 异变等级：0 典型 / 1 微异 / 2 显异 / 3 极异。 */
export type MutationLevel = 0 | 1 | 2 | 3

export interface MutationResult {
  isMutated: boolean
  deviation: number // 归一化欧氏距离 D ∈ [0,1]
  tau: number // 该年龄的阈值
  level: MutationLevel
  drivers: Dim[] // 造成偏离最大的维度（可解释）
}

export interface MatchExplain {
  relation: ElementRelation
  similarDims: Dim[] // 命中的相似维
  complementDims: Dim[] // 命中的互补维
  idealFit?: number // 理想型契合度（仅当提供理想型）
}
export interface MatchResult {
  sign: string
  score: number // 0..1（归一后）
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
