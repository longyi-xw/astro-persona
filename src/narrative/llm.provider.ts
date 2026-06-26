// 预留 stub：未来经边缘函数调用大模型（密钥藏服务端 + 缓存 + 失败降级到模板）。
// 本期：所有方法直接降级到注入的 fallback（模板实现）。
import type { Archetype, NarrativeContext, NarrativeProvider } from './provider'

export class LLMNarrativeProvider implements NarrativeProvider {
  constructor(private readonly fallback: NarrativeProvider) {}

  // structured getters are deterministic lookups — always delegate
  archetype(ctx: NarrativeContext): Archetype {
    return this.fallback.archetype(ctx)
  }
  keywords(ctx: NarrativeContext): string[] {
    return this.fallback.keywords(ctx)
  }
  matchReasons(ctx: NarrativeContext): string[] {
    return this.fallback.matchReasons(ctx)
  }

  // prose methods: future → fetch('/api/narrative', …) with cache + degrade.
  // this period → degrade immediately to the template implementation.
  async personalityCopy(ctx: NarrativeContext): Promise<string> {
    return this.fallback.personalityCopy(ctx)
  }
  async mutationCopy(ctx: NarrativeContext): Promise<string> {
    return this.fallback.mutationCopy(ctx)
  }
  async matchCopy(ctx: NarrativeContext): Promise<string> {
    return this.fallback.matchCopy(ctx)
  }
}
