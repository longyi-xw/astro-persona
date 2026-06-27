import { describe, expect, it } from 'vitest'
import { LLMNarrativeProvider, type NarrativeContext, TemplateNarrativeProvider } from '~/narrative'
import { getCopyBundles } from '~/content'
import type { PersonalityVector } from '~/core/types'

const provider = new TemplateNarrativeProvider(getCopyBundles())
const fire: PersonalityVector = { fire: 0.86, earth: 0.32, air: 0.66, water: 0.28, expr: 0.74, order: 0.38 }

const ctx = (over: Partial<NarrativeContext> = {}): NarrativeContext => ({
  locale: 'zh',
  vector: fire,
  sign: 'aries',
  signName: '白羊座',
  ...over,
})

describe('archetype & keywords', () => {
  it('names by top-2 dominant dims (fire·expr → 燃核推进 / The Ignition)', () => {
    const a = provider.archetype(ctx())
    expect(a.name).toBe('燃核推进')
    expect(a.latin).toBe('The Ignition')
    expect(a.blurb).toBeTruthy()
  })

  it('uses the English name in the en bundle', () => {
    expect(provider.archetype(ctx({ locale: 'en' })).name).toBe('The Ignition')
  })

  it('keywords pull from the dominant element high pool', () => {
    expect(provider.keywords(ctx())).toContain('炽烈')
  })
})

describe('mutation copy (multi-variant, deterministic)', () => {
  it('picks a Marked-drift variant with the sign interpolated, stable per vector', async () => {
    const c = ctx({ mutation: { level: 2, dims: ['water'] } })
    const a = await provider.mutationCopy(c)
    expect(a).toBe(await provider.mutationCopy(c)) // deterministic
    expect(a).not.toContain('{sign}') // interpolated
    const variants = getCopyBundles().zh.mutation.notable.map((s) => s.replace('{sign}', '白羊座'))
    expect(variants).toContain(a)
  })

  it('emits a valid variant for a different vector/sign too', async () => {
    const earthy: PersonalityVector = { fire: 0.2, earth: 0.9, air: 0.3, water: 0.4, expr: 0.3, order: 0.85 }
    const line = await provider.mutationCopy(ctx({ vector: earthy, sign: 'capricorn', signName: '摩羯座', mutation: { level: 3, dims: ['fire'] } }))
    const variants = getCopyBundles().zh.mutation.extreme.map((s) => s.replace('{sign}', '摩羯座'))
    expect(variants).toContain(line)
  })

  it('typical (level 0) reads as true-to-sign', async () => {
    const line = await provider.mutationCopy(ctx({ mutation: { level: 0, dims: [] } }))
    expect(getCopyBundles().zh.mutation.typical.map((s) => s.replace('{sign}', '白羊座'))).toContain(line)
  })
})

describe('match reasons', () => {
  it('builds a reason from sameElement + hit dims + ideal', () => {
    const reasons = provider.matchReasons(
      ctx({ match: [{ sign: 'leo', sameElement: true, element: 'fire', similarDims: ['order'], complementDims: ['fire'], idealFit: 0.9 }] }),
    )
    expect(reasons[0]).toContain('火象同频')
    expect(reasons[0]).toContain('理想型')
  })
})

describe('LLMNarrativeProvider (stub)', () => {
  it('degrades to the template output verbatim', async () => {
    const llm = new LLMNarrativeProvider(provider)
    const c = ctx({ mutation: { level: 2, dims: ['water'] } })
    expect(llm.archetype(c)).toEqual(provider.archetype(c))
    expect(await llm.mutationCopy(c)).toBe(await provider.mutationCopy(c))
  })
})
