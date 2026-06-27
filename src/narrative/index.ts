// 工厂：通过 VITE_USE_LLM 切换实现，业务调用方代码零改动（design/02 §8）。
import { getCopyBundles } from '~/content'
import { LLMNarrativeProvider } from './llm.provider'
import { TemplateNarrativeProvider } from './template.provider'
import type { NarrativeProvider } from './provider'

export * from './provider'
export { TemplateNarrativeProvider } from './template.provider'
export { LLMNarrativeProvider } from './llm.provider'

// Vite inlines VITE_USE_LLM at build; cast keeps it typed across Nuxt versions.
const llmEnabled =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_USE_LLM === 'true'

/** Construct the active provider (template-only this period; LLM degrades to it). */
export function createNarrative(useLlm = llmEnabled): NarrativeProvider {
  const template = new TemplateNarrativeProvider(getCopyBundles())
  return useLlm ? new LLMNarrativeProvider(template) : template
}

/** Singleton for app usage. */
export const narrative: NarrativeProvider = createNarrative()
