// 本期唯一启用：纯模板/规则，离线、免费。异变文案多变体，由向量确定性选取——
// 同一结果稳定可复现（URL 分享），跨人则多变。
import { dominantDims, missingDims } from '~/core/personality'
import type { Dim, MutationLevel, PersonalityVector } from '~/core/types'
import { DIMS } from '~/core/types'
import type { CopyBundle, Locale } from '~/content'
import type { Archetype, NarrativeContext, NarrativeProvider } from './provider'

const LEVEL_KEY = { 0: 'typical', 1: 'micro', 2: 'notable', 3: 'extreme' } as const

export class TemplateNarrativeProvider implements NarrativeProvider {
  constructor(private readonly bundles: Record<Locale, CopyBundle>) {}

  private copy(ctx: NarrativeContext): CopyBundle {
    return this.bundles[ctx.locale]
  }
  private dl(ctx: NarrativeContext, d: Dim): string {
    return this.copy(ctx).dims[d]
  }
  private signName(ctx: NarrativeContext): string {
    return ctx.signName ?? ctx.sign
  }

  /** Deterministic choice keyed by the vector: stable per result, varied across people. */
  private pick<T>(arr: T[], v: PersonalityVector, salt = 0): T {
    if (arr.length <= 1) return arr[0] as T
    let h = salt
    DIMS.forEach((d, i) => {
      h += Math.round(v[d] * 100) * (i + 1)
    })
    return arr[((h % arr.length) + arr.length) % arr.length] as T
  }

  private matchedIndex(ctx: NarrativeContext): number {
    const [p, s] = dominantDims(ctx.vector, 2)
    const arr = this.copy(ctx).archetypes
    let i = arr.findIndex((a) => a.primary === p && a.secondary === s)
    if (i < 0) i = arr.findIndex((a) => a.primary === p && !a.secondary)
    if (i < 0) i = arr.findIndex((a) => a.primary === p)
    return i < 0 ? 0 : i
  }

  archetype(ctx: NarrativeContext): Archetype {
    const local = this.copy(ctx).archetypes[this.matchedIndex(ctx)]!
    const en = this.bundles.en.archetypes.find((a) => a.id === local.id) ?? local
    return { name: local.name, latin: en.name, blurb: local.blurb }
  }

  /** Top dominant dims' high keywords + the leading missing dim's low keyword. */
  keywords(ctx: NarrativeContext): string[] {
    const c = this.copy(ctx)
    const [d0, d1] = dominantDims(ctx.vector, 2)
    const miss = missingDims(ctx.vector, 1)[0] ?? 'water'
    const out = [
      ...(d0 ? c.keywords[d0].high.slice(0, 2) : []),
      ...(d1 ? [c.keywords[d1].high[0]] : []),
      c.keywords[miss].low[0],
    ].filter((x): x is string => !!x)
    return [...new Set(out)].slice(0, 4)
  }

  matchReasons(ctx: NarrativeContext): string[] {
    const r = this.copy(ctx).matchReasons
    return (ctx.match ?? []).map((m) => {
      const parts: string[] = []
      if (m.sameElement) parts.push(r.sameElement.replace('{element}', this.dl(ctx, m.element)))
      if (m.similarDims.length) parts.push(r.similar.replace('{dim}', m.similarDims.map((d) => this.dl(ctx, d)).join('·')))
      if (m.complementDims.length) parts.push(r.complement.replace('{dim}', m.complementDims.map((d) => this.dl(ctx, d)).join('·')))
      if (!parts.length) parts.push(r.base)
      let body = r.lead + parts.join(r.sep)
      if (m.idealFit !== undefined && m.idealFit >= 0.85) body += r.sep + r.ideal
      return body
    })
  }

  async personalityCopy(ctx: NarrativeContext): Promise<string> {
    const c = this.copy(ctx)
    const dominant = dominantDims(ctx.vector, 2).map((d) => this.dl(ctx, d)).join(ctx.locale === 'zh' ? '与' : ' & ')
    const missing = this.dl(ctx, missingDims(ctx.vector, 1)[0] ?? 'water')
    return c.personality
      .replace('{archetype}', this.archetype(ctx).name)
      .replace('{dominant}', dominant)
      .replace('{missing}', missing)
  }

  async mutationCopy(ctx: NarrativeContext): Promise<string> {
    const c = this.copy(ctx)
    const level = (ctx.mutation?.level ?? 0) as MutationLevel
    const line = this.pick(c.mutation[LEVEL_KEY[level]], ctx.vector, level)
    return line.replace('{sign}', this.signName(ctx))
  }

  async matchCopy(ctx: NarrativeContext): Promise<string> {
    return this.copy(ctx).matchSummary
  }
}
