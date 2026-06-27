// Typed fixtures sourced through the single content entry (src/content), so
// tests run against the same validated data the app ships.
import type { SignProfile } from '~/core/types'
import {
  getCompatMatrix,
  getConfig,
  getMaxScores,
  getNeutral,
  getQuestionItems,
  getSignProfile,
  getSignProfiles,
} from '~/content'

export const signs = getSignProfiles()
export const items = getQuestionItems()
export const config = getConfig()
export const compat = getCompatMatrix()
export const maxScores = getMaxScores()
export const neutral = getNeutral()

export const signById = (id: string): SignProfile => {
  const s = getSignProfile(id)
  if (!s) throw new Error(`sign not found: ${id}`)
  return s
}

/** Deterministic LCG for reproducible synthetic populations. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
