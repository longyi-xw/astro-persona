import { describe, expect, it } from 'vitest'
import { LLMNarrativeProvider, type NarrativeContext, TemplateNarrativeProvider } from '~/narrative'
import { copyBundles } from '~/data'
import type { PersonalityVector } from '~/core/types'

const provider = new TemplateNarrativeProvider(copyBundles)
const fire: PersonalityVector = { fire: 0.86, earth: 0.32, air: 0.66, water: 0.28, expr: 0.74, order: 0.38 }

const ctx = (over: Partial<NarrativeContext> = {}): NarrativeContext => ({
  locale: 'zh',
  vector: fire,
  sign: 'aries',
  signName: '白羊座',
  ...over,
})

describe('TemplateNarrativeProvider', () => {
  it('names the archetype by dominant element (zh & en)', () => {
    expect(provider.archetype(ctx()).name).toBe('炽焰先锋')
    expect(provider.archetype(ctx({ locale: 'en' })).latin).toBe('The Ember Vanguard')
  })

  it('returns the dominant element keyword pool (matches prototype tags)', () => {
    expect(provider.keywords(ctx())).toEqual(['主动', '热望', '不安分'])
  })

  it('is deterministic — same input, same prose', async () => {
    const a = await provider.personalityCopy(ctx())
    const b = await provider.personalityCopy(ctx())
    expect(a).toBe(b)
    expect(a).toContain('炽焰先锋')
  })

  it('renders the Marked-Drift message with the sign interpolated', async () => {
    const zh = await provider.mutationCopy(ctx({ mutation: { level: 2, dims: ['water'] } }))
    expect(zh).toBe('你已经走出了星座给的剧本。这一切，都是你一路经历换来的。')
    const en = await provider.mutationCopy(ctx({ locale: 'en', signName: 'Aries', mutation: { level: 1, dims: ['water', 'order'] } }))
    expect(en).toContain('Aries')
  })

  it('builds match reasons from relation + hit dims + ideal', () => {
    const reasons = provider.matchReasons(
      ctx({
        match: [{ sign: 'sagittarius', relation: 'same', similarDims: ['order'], complementDims: ['fire'], idealFit: 0.9 }],
      }),
    )
    expect(reasons[0]).toContain('同象同频')
    expect(reasons[0]).toContain('理想型')
  })
})

describe('LLMNarrativeProvider (stub)', () => {
  it('degrades to the template output verbatim this period', async () => {
    const llm = new LLMNarrativeProvider(provider)
    const c = ctx({ mutation: { level: 2, dims: ['water'] } })
    expect(llm.archetype(c)).toEqual(provider.archetype(c))
    expect(await llm.personalityCopy(c)).toBe(await provider.personalityCopy(c))
    expect(await llm.mutationCopy(c)).toBe(await provider.mutationCopy(c))
  })
})
