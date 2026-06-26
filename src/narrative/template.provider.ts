// 本期唯一启用：纯模板/规则，离线、免费、确定性强（同输入→同输出）。
import { dominantDims, dominantElement, missingDims } from '~/core/personality'
import type { Dim } from '~/core/types'
import type { CopyBundle, Locale } from '~/data'
import type { Archetype, NarrativeContext, NarrativeProvider } from './provider'

export class TemplateNarrativeProvider implements NarrativeProvider {
  constructor(private readonly bundles: Record<Locale, CopyBundle>) {}

  private copy(ctx: NarrativeContext): CopyBundle {
    return this.bundles[ctx.locale]
  }

  private signName(ctx: NarrativeContext): string {
    return ctx.signName ?? ctx.sign
  }

  private label(ctx: NarrativeContext, dims: Dim[]): string {
    const c = this.copy(ctx)
    return dims.map((d) => c.dims[d]).join(c.connectors.and)
  }

  archetype(ctx: NarrativeContext): Archetype {
    return this.copy(ctx).archetypes[dominantElement(ctx.vector)]
  }

  /** Keywords from the dominant element's pool (matches prototype result tags). */
  keywords(ctx: NarrativeContext): string[] {
    const pool = this.copy(ctx).keywords[dominantElement(ctx.vector)]
    return [...pool]
  }

  matchReasons(ctx: NarrativeContext): string[] {
    const c = this.copy(ctx)
    return (ctx.match ?? []).map((m) => {
      const parts: string[] = [c.relation[m.relation]]
      if (m.similarDims.length) parts.push(c.connectors.similar.replace('{dims}', this.label(ctx, m.similarDims)))
      if (m.complementDims.length) {
        parts.push(c.connectors.complement.replace('{dims}', this.label(ctx, m.complementDims)))
      }
      let ideal = ''
      if (m.idealFit !== undefined) ideal = m.idealFit >= 0.85 ? c.connectors.idealHigh : c.connectors.idealMid
      return parts.join(c.connectors.listSep) + ideal
    })
  }

  async personalityCopy(ctx: NarrativeContext): Promise<string> {
    const c = this.copy(ctx)
    const dominant = this.label(ctx, dominantDims(ctx.vector, 2))
    const missing = c.dims[missingDims(ctx.vector, 1)[0] ?? 'water']
    return c.personality
      .replace('{archetype}', this.archetype(ctx).name)
      .replace('{dominant}', dominant)
      .replace('{missing}', missing)
  }

  async mutationCopy(ctx: NarrativeContext): Promise<string> {
    const c = this.copy(ctx)
    const level = (ctx.mutation?.level ?? 0).toString() as '0' | '1' | '2' | '3'
    const dims = this.label(ctx, ctx.mutation?.dims ?? [])
    return c.mutation[level].replace('{sign}', this.signName(ctx)).replace('{dims}', dims)
  }

  async matchCopy(ctx: NarrativeContext): Promise<string> {
    return this.copy(ctx).matchSummary
  }
}
