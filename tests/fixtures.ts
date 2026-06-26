// Load the real version-controlled content as typed fixtures, so tests run
// against the same data the app ships (not toy data).
import type { Config, Question, SignProfile } from '~/core/types'
import profilesJson from '~~/content/signs/profiles.json'
import weightsJson from '~~/content/questions/weights.json'
import configJson from '~~/content/config/weights.json'

export const signs = profilesJson.signs as unknown as SignProfile[]
export const questions = weightsJson.questions as unknown as Question[]
export const config = configJson as unknown as Config

export const signById = (id: string): SignProfile => {
  const s = signs.find((x) => x.id === id)
  if (!s) throw new Error(`sign not found: ${id}`)
  return s
}

/** Tiny deterministic PRNG (LCG) for reproducible synthetic populations. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
