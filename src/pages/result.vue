<script setup lang="ts">
import { config, copyBundles, neutral, signById, signText, type Locale } from '~/data'
import { effectiveBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { dominantElement } from '~/core/personality'
import { DIMS, type Dim } from '~/core/types'
import { decodeResult } from '~/utils/resultCodec'
import { narrative } from '~/narrative'
import { DIM_COLOR, ELEMENT_COLOR, ELEMENT_TEXT } from '~/utils/theme'
import { useShareCard } from '~/composables/useShareCard'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const state = computed(() => {
  const s = route.query.s
  return typeof s === 'string' ? decodeResult(s) : null
})
const profile = computed(() => (state.value ? signById(state.value.sign) : undefined))

const mut = computed(() => {
  if (!state.value || !profile.value) return null
  const eff = effectiveBaseline(profile.value.baseline, neutral, state.value.ageBand, config)
  return detectMutation(state.value.v, eff, state.value.ageBand, config)
})

const ctx = computed(() => {
  if (!state.value) return null
  return {
    locale: locale.value as Locale,
    vector: state.value.v,
    sign: state.value.sign,
    signName: signText(locale.value as Locale, state.value.sign)?.name ?? state.value.sign,
    mutation: mut.value?.isMutated ? { level: mut.value.level, dims: mut.value.drivers } : undefined,
  }
})

const archetype = computed(() => (ctx.value ? narrative.archetype(ctx.value) : null))
const keywords = computed(() => (ctx.value ? narrative.keywords(ctx.value) : []))
const accent = computed(() => (state.value ? ELEMENT_COLOR[dominantElement(state.value.v)] : '#C9A24B'))
const driftColor = computed(() => (state.value ? ELEMENT_TEXT[dominantElement(state.value.v)] : '#F0B59A'))
const driftLabel = computed(() => {
  if (!mut.value) return ''
  const key = String(mut.value.isMutated ? mut.value.level : 0) as '0' | '1' | '2' | '3'
  return copyBundles[locale.value as Locale].mutationLabel[key]
})

const scores = computed(() => {
  if (!state.value) return []
  const c = copyBundles[locale.value as Locale]
  const en = copyBundles.en
  return (DIMS as readonly Dim[])
    .map((d) => ({ d, val: Math.round(state.value!.v[d] * 100), color: DIM_COLOR[d], label: c.dims[d], code: en.dims[d] }))
    .sort((a, b) => b.val - a.val)
})

const personality = ref('')
const driftMsg = ref('')
watchEffect(async () => {
  if (!ctx.value) return
  personality.value = await narrative.personalityCopy(ctx.value)
  driftMsg.value = await narrative.mutationCopy(ctx.value)
})

const { cardRef, saving, saveImage } = useShareCard('astro-persona')

useSeoMeta({ title: () => `${archetype.value?.name ?? t('result.eyebrow')} · ${t('brand')}`, description: () => personality.value })
</script>

<template>
  <div class="max-w-xl mx-auto px-4 sm:px-6 py-8">
    <!-- empty state -->
    <div v-if="!state || !profile" class="panel px-7 py-12 text-center">
      <p class="text-[15px] text-muted">{{ t('result.needTest') }}</p>
      <NuxtLink :to="localePath('/test')" class="btn-gold inline-block mt-5 px-6 py-3 text-[14px]">{{ t('result.goTest') }}</NuxtLink>
    </div>

    <article v-else class="panel" style="box-shadow: 0 50px 110px rgba(0,0,0,0.6)">
      <!-- compass + archetype -->
      <div class="px-6 pt-9 text-center">
        <div class="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">{{ t('result.eyebrow') }}</div>
        <div class="flex justify-center my-4" style="filter: drop-shadow(0 0 40px rgba(201,162,75,0.28))">
          <div class="w-[300px] h-[300px] sm:w-[330px] sm:h-[330px]">
            <EnergyCompass :vector="state.v" :baseline="profile.baseline" :size="330" :accent="accent" show-labels />
          </div>
        </div>
        <h1 class="mt-3 mb-0 font-serif-sc font-600 text-[34px] sm:text-[38px] leading-[1.1]">{{ archetype?.name }}</h1>
        <p class="mt-1 font-serif-latin italic text-[22px] sm:text-[24px] text-[#d7ccae]">{{ archetype?.latin }}</p>
        <div class="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full" :style="{ background: accent + '29', border: `1px solid ${accent}80` }">
          <span class="w-1.5 h-1.5 rounded-full" :style="{ background: accent }" />
          <span class="font-mono text-[12px] tracking-[0.08em]" :style="{ color: driftColor }">{{ t('home.driftLabel').split(' · ')[0] }} · {{ driftLabel }}</span>
        </div>
      </div>

      <!-- six dimensions -->
      <div class="mx-6 mt-7 p-5 card-inset">
        <div class="flex items-center justify-between mb-4">
          <span class="font-mono text-[11px] tracking-[0.14em] text-gold">{{ t('result.six') }}</span>
          <span class="font-mono text-[10.5px] text-faint">/ 100</span>
        </div>
        <div class="flex flex-col gap-3.5">
          <div v-for="(s, i) in scores" :key="s.d" class="flex items-center gap-3">
            <span class="font-serif-sc text-[14px] w-[18px]" :style="{ color: s.color }">{{ s.label }}</span>
            <span class="font-mono text-[11px] text-dim w-[42px]">{{ s.code }}</span>
            <div class="flex-1 h-[7px] rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
              <div class="h-full rounded-full" :style="{ width: s.val + '%', background: s.color }" />
            </div>
            <span class="font-mono text-[14px] font-600 w-[30px] text-right">{{ s.val }}</span>
            <span class="font-mono text-[9.5px] w-[58px] text-[#8089b0] text-right">{{ i === 0 ? t('result.lead') : i === scores.length - 1 ? t('result.gap') : '' }}</span>
          </div>
        </div>
        <p class="mt-4 pt-3.5 border-t border-dotted border-[rgba(255,255,255,0.12)] text-[12px] text-muted leading-[1.6]">{{ personality }}</p>
      </div>

      <!-- keywords -->
      <div class="flex flex-wrap gap-2 px-6 pt-5">
        <span v-for="kw in keywords" :key="kw" class="px-3.5 py-1.5 rounded-full text-[12.5px]" :style="{ background: accent + '24', border: `1px solid ${accent}66`, color: driftColor }">{{ kw }}</span>
      </div>

      <!-- drift message -->
      <div class="mx-6 mt-5 p-5 rounded-2xl" :style="{ background: `linear-gradient(135deg, ${accent}29, rgba(201,162,75,0.06))`, border: `1px solid ${accent}57` }">
        <div class="font-mono text-[11px] tracking-[0.14em] uppercase mb-2.5" :style="{ color: accent }">{{ t('result.drift') }}</div>
        <p class="m-0 font-serif-sc text-[17px] leading-[1.7]">{{ driftMsg }}</p>
      </div>

      <!-- actions -->
      <div class="flex gap-2.5 px-6 pt-6">
        <NuxtLink :to="localePath({ path: '/match', query: { s: route.query.s as string } })" class="btn-gold flex-1 text-center py-3.5 text-[14px]">{{ t('result.ctaMatch') }}</NuxtLink>
        <button type="button" class="btn-ghost px-4 py-3.5 text-[14px] disabled:opacity-50" :disabled="saving" @click="saveImage">{{ saving ? '…' : t('common.save') }}</button>
      </div>

      <p class="px-6 py-6 text-[11px] text-faint text-center">{{ t('common.disclaimer') }}</p>
    </article>

    <!-- offscreen share card -->
    <ShareCard
      v-if="state && archetype"
      ref="cardRef"
      :vector="state.v"
      :archetype="archetype"
      :keywords="keywords"
      :glyph="profile?.glyph ?? ''"
      :accent="accent"
      :drift-label="driftLabel"
      :drift-color="driftColor"
    />
  </div>
</template>
