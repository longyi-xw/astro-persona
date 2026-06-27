// 全项目唯一的内容/配置数据入口（design/05 §A1）。
// 不变量：组件与 src/core 禁止直接 import content/*.json，一律经这里取用。
import {
  computeMaxScores,
  validateContent,
  type Config,
  type CopyFile,
  type Dim,
  type PersonalityVector,
  type QuestionItem,
  type SignContent,
  type SignProfile,
} from '~/core/content.schema'

import profiles from '~~/content/signs/profiles.json'
import signZh from '~~/content/signs/zh.json'
import signEn from '~~/content/signs/en.json'
import items from '~~/content/questions/items.json'
import qZh from '~~/content/questions/zh.json'
import qEn from '~~/content/questions/en.json'
import config from '~~/content/config/weights.json'
import compat from '~~/content/config/compat-matrix.json'
import copyZh from '~~/content/copy/zh.json'
import copyEn from '~~/content/copy/en.json'

export type Locale = 'zh' | 'en'

// 启动校验一次（含 zh/en id 对齐、矩阵对称等）；失败即抛错，让 build/test 变红。
const C = validateContent({ profiles, signZh, signEn, items, qZh, qEn, config, compat, copyZh, copyEn })

/* ---------- 星座 ---------- */
export const getSignProfiles = (): SignProfile[] => C.profiles.signs
export const getSignProfile = (id: string): SignProfile | undefined => C.profiles.signs.find((s) => s.id === id)
export const getSignIds = (): string[] => C.profiles.signs.map((s) => s.id)
export const getBaseline = (id: string): PersonalityVector | undefined => getSignProfile(id)?.baseline
export const getNeutral = (): PersonalityVector => C.neutral
// (locale, id) order to match getQuestionContent(locale) and the call sites.
export const getSignContent = (locale: Locale, id: string): SignContent | undefined => C.signContent[locale].signs[id]

/* ---------- 题库 ---------- */
export const getQuestionItems = (): QuestionItem[] => C.items.questions
export const getMaxScores = (): Record<Dim, number> => C.maxScores
/** Per-tier normalization denominator (quick uses a subset of questions). */
export const maxScoresFor = (qs: QuestionItem[]): Record<Dim, number> => computeMaxScores(qs)
export const getQuestionContent = (locale: Locale) => C.questionContent[locale].questions

/* ---------- 配置 ---------- */
export const getConfig = (): Config => C.config
export const getCompatMatrix = (): Record<string, Record<string, number>> => C.compat
export const getCompat = (a: string, b: string): number => C.compat[a]?.[b] ?? 0

/* ---------- 文案库 ---------- */
export type CopyBundle = CopyFile
export const getCopyBundles = (): Record<Locale, CopyBundle> => C.copy
