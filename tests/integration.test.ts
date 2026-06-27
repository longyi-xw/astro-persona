import { describe, expect, it } from 'vitest'
import { getCompatMatrix, getConfig, getCopyBundles, getMaxScores, getNeutral, getQuestionItems, getSignProfile, getSignProfiles } from '~/content'
import { dominantElement, score } from '~/core/personality'
import { effectiveBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { rankMatches } from '~/core/matching'
import { TemplateNarrativeProvider } from '~/narrative'
import { decodeResult, encodeResult } from '~/utils/resultCodec'

// Exercises the same path the test → result → match pages take, on real content.
describe('end-to-end pipeline (real content)', () => {
  const items = getQuestionItems()
  const config = getConfig()
  const provider = new TemplateNarrativeProvider(getCopyBundles())
  const allA = Object.fromEntries(items.map((q) => [q.id, 'a']))
  const v = score(items, allA, getMaxScores())

  it('answers → fire-led vector', () => {
    expect(dominantElement(v)).toBe('fire')
  })

  it('drift detection responds to the sun sign (Aries near; Pisces far)', () => {
    const at = (sign: string) =>
      detectMutation(v, effectiveBaseline(getSignProfile(sign)!.baseline, getNeutral(), 2, config), 2, config)
    expect(at('pisces').isMutated).toBe(true) // extreme fire vs water → drift
    expect(at('aries').deviation).toBeLessThan(at('pisces').deviation) // closer to a fiery sign
  })

  it('narrative produces an archetype + an interpolated drift line', async () => {
    const mut = detectMutation(v, effectiveBaseline(getSignProfile('pisces')!.baseline, getNeutral(), 2, config), 2, config)
    const ctx = { locale: 'zh' as const, vector: v, sign: 'pisces', signName: '双鱼座', mutation: { level: mut.level, dims: mut.drivers } }
    expect(provider.archetype(ctx).name).toBeTruthy()
    expect(provider.archetype(ctx).latin).toBeTruthy()
    expect(await provider.mutationCopy(ctx)).not.toContain('{sign}')
    expect(provider.keywords(ctx).length).toBeGreaterThan(0)
  })

  it('ranks matches and narrates a reason for each', () => {
    const matches = rankMatches('aries', v, getSignProfiles(), config, { compat: getCompatMatrix() })
    expect(matches.length).toBeGreaterThan(0)
    const reasons = provider.matchReasons({
      locale: 'zh',
      vector: v,
      sign: 'aries',
      match: matches.map((m) => ({
        sign: m.sign,
        sameElement: m.explain.sameElement,
        element: m.explain.element,
        similarDims: m.explain.similarDims,
        complementDims: m.explain.complementDims,
        idealFit: m.explain.idealFit,
      })),
    })
    expect(reasons).toHaveLength(matches.length)
    expect(reasons.every((r) => r.length > 0)).toBe(true)
  })

  it('result round-trips through the share URL', () => {
    const mut = detectMutation(v, effectiveBaseline(getSignProfile('aries')!.baseline, getNeutral(), 2, config), 2, config)
    const state = { v, sign: 'aries', ageBand: 2, mutated: mut.isMutated ? { level: mut.level, dims: mut.drivers } : undefined }
    const back = decodeResult(encodeResult(state))!
    expect(back.sign).toBe('aries')
    for (const d of Object.keys(v) as (keyof typeof v)[]) expect(back.v[d]).toBeCloseTo(v[d], 2)
  })
})
