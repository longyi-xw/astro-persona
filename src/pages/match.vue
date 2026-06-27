<script setup lang="ts">
import { reactive } from 'vue'
import { getCompatMatrix, getConfig, getNeutral, getSignContent, getSignProfile, getSignProfiles, type Locale } from '~/content'
import { effectiveBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { rankMatches } from '~/core/matching'
import { narrative } from '~/narrative'
import type { MatchResult, PersonalityVector } from '~/core/types'
import { decodeResult } from '~/utils/resultCodec'
import { ELEMENT_COLOR, textGlyph } from '~/utils/theme'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const phase = ref<'input' | 'results'>('input')
const idealOn = ref(true)
const sl = reactive({ adventure: 0.6, outgoing: 0.55, feeling: 0.55 })

const SLIDERS = [
  { key: 'adventure', color: ELEMENT_COLOR.fire },
  { key: 'outgoing', color: ELEMENT_COLOR.air },
  { key: 'feeling', color: ELEMENT_COLOR.water },
] as const

const ideal = computed<PersonalityVector | null>(() =>
  idealOn.value
    ? { fire: sl.adventure, earth: 0.5, air: 0.5, water: sl.feeling, expr: sl.outgoing, order: 1 - sl.adventure * 0.5 }
    : null,
)

const userState = computed(() => (typeof route.query.s === 'string' ? decodeResult(route.query.s) : null))
const mutated = computed(() => {
  const u = userState.value
  if (!u) return false
  const p = getSignProfile(u.sign)
  if (!p) return false
  const config = getConfig()
  return detectMutation(u.v, effectiveBaseline(p.baseline, getNeutral(), u.ageBand, config), u.ageBand, config).isMutated
})

const results = computed<MatchResult[]>(() =>
  userState.value
    ? rankMatches(userState.value.sign, userState.value.v, getSignProfiles(), getConfig(), {
        compat: getCompatMatrix(),
        ideal: ideal.value,
        mutated: mutated.value,
      })
    : [],
)

const reasons = computed(() =>
  userState.value
    ? narrative.matchReasons({
        locale: locale.value as Locale,
        vector: userState.value.v,
        sign: userState.value.sign,
        match: results.value.map((r) => ({
          sign: r.sign,
          sameElement: r.explain.sameElement,
          element: r.explain.element,
          similarDims: r.explain.similarDims,
          complementDims: r.explain.complementDims,
          idealFit: r.explain.idealFit,
        })),
      })
    : [],
)

const cards = computed(() =>
  results.value.map((r, i) => {
    const p = getSignProfile(r.sign)
    return {
      id: r.sign,
      glyph: textGlyph(p?.glyph ?? ''),
      color: p ? ELEMENT_COLOR[p.element] : '#C9A24B',
      name: getSignContent(locale.value as Locale, r.sign)?.name ?? r.sign,
      alt: getSignContent(locale.value === 'zh' ? 'en' : 'zh', r.sign)?.name ?? '',
      pct: Math.round(r.score * 100),
      reason: reasons.value[i] ?? '',
    }
  }),
)
const bestBaseline = computed(() => (results.value[0] ? getSignProfile(results.value[0].sign)?.baseline ?? null : null))

useSeoMeta({ title: () => `${t('matchResult.title')} · ${t('brand')}` })
</script>

<template>
  <div class="max-w-xl mx-auto px-4 sm:px-6 py-8">
    <div v-if="!userState" class="panel px-7 py-12 text-center">
      <p class="text-[15px] text-muted">{{ t('result.needTest') }}</p>
      <NuxtLink :to="localePath('/test')" class="btn-gold inline-block mt-5 px-6 py-3 text-[14px]">{{ t('result.goTest') }}</NuxtLink>
    </div>

    <!-- ===== INPUT ===== -->
    <div v-else-if="phase === 'input'" class="panel px-6 sm:px-7 py-8">
      <h1 class="m-0 font-serif-sc font-600 text-[26px] leading-[1.2]">{{ t('matchInput.title') }}</h1>
      <p class="mt-1 font-serif-latin italic text-[19px] text-[#cdbf9e]">{{ t('matchInput.titleLatin') }}</p>
      <p class="mt-4 text-[13px] leading-[1.7] text-muted">{{ t('matchInput.desc') }} <span class="text-dim">{{ t('matchInput.descLatin') }}</span></p>

      <div class="mt-6 flex items-center justify-between p-4 rounded-2xl bg-[rgba(27,36,82,0.5)] border border-[rgba(201,162,75,0.18)]">
        <div>
          <div class="text-[14px]">{{ t('matchInput.idealLabel') }}</div>
          <div class="text-[11.5px] text-dim mt-0.5">{{ t('matchInput.idealSub') }}</div>
        </div>
        <button type="button" role="switch" :aria-checked="idealOn" class="w-[46px] h-[26px] rounded-full relative flex-none transition-colors" :style="{ background: idealOn ? '#C9A24B' : 'rgba(255,255,255,0.18)' }" @click="idealOn = !idealOn">
          <span class="absolute top-[3px] w-5 h-5 rounded-full bg-ink transition-all" :style="{ left: idealOn ? '23px' : '3px' }" />
        </button>
      </div>

      <div v-if="idealOn" class="mt-6 flex flex-col gap-5">
        <div v-for="s in SLIDERS" :key="s.key">
          <div class="flex justify-between text-[12.5px] mb-2.5">
            <span class="text-muted">{{ t(`matchInput.sliders.${s.key}.lo`) }}</span>
            <span class="font-mono text-[11px]" :style="{ color: s.color }">{{ Math.round(sl[s.key] * 100) }}%</span>
            <span class="text-muted">{{ t(`matchInput.sliders.${s.key}.hi`) }}</span>
          </div>
          <input v-model.number="sl[s.key]" type="range" min="0" max="1" step="0.01" class="ap-range w-full" :style="{ accentColor: s.color }">
        </div>
      </div>

      <button type="button" class="btn-gold w-full mt-8 py-4 text-[15px]" @click="phase = 'results'">{{ t('matchInput.begin') }}</button>
    </div>

    <!-- ===== RESULTS ===== -->
    <div v-else class="panel">
      <div class="px-6 pt-7 pb-4 text-center border-b border-[rgba(201,162,75,0.1)]">
        <h1 class="m-0 font-serif-sc font-600 text-[24px] leading-[1.35]">{{ t('matchResult.title') }}</h1>
        <p class="mt-1 font-serif-latin italic text-[18px] text-[#cdbf9e]">{{ t('matchResult.titleLatin') }}</p>
        <div v-if="bestBaseline" class="flex justify-center mt-3.5" style="filter: drop-shadow(0 0 30px rgba(201,162,75,0.22))">
          <div class="w-[200px] h-[200px]"><EnergyCompass :vector="userState.v" :baseline="bestBaseline" :size="200" accent="#C9A24B" /></div>
        </div>
        <div class="flex justify-center gap-4.5 mt-2 font-mono text-[10.5px] text-muted">
          <span><span class="text-gold">━</span> {{ t('matchResult.legendYou') }}</span>
          <span><span class="text-air">┅</span> {{ t('matchResult.legendFit') }}</span>
        </div>
      </div>

      <div class="px-6 pt-5 flex flex-col gap-3">
        <div v-for="m in cards" :key="m.id" class="p-4 rounded-2xl bg-[rgba(27,36,82,0.5)] border border-[rgba(255,255,255,0.05)]" :style="{ borderLeft: `3px solid ${m.color}` }">
          <div class="flex items-center gap-3.5">
            <span class="font-symbol text-[28px] w-[34px] text-center" :style="{ color: m.color }">{{ m.glyph }}</span>
            <div class="flex-1 flex items-baseline gap-2">
              <span class="font-serif-sc text-[17px]">{{ m.name }}</span>
              <span class="font-serif-latin italic text-[14px] text-muted">{{ m.alt }}</span>
            </div>
            <span class="font-mono text-[24px] font-600">{{ m.pct }}<span class="text-[13px] text-[#8089b0]">%</span></span>
          </div>
          <p class="mt-3 text-[12.5px] leading-[1.65] text-[#cfd4ea]">{{ m.reason }}</p>
        </div>
      </div>

      <div v-if="mutated" class="mx-6 mt-3.5 p-3.5 rounded-xl bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.22)] text-[12px] text-[#cdbf9e] leading-[1.6]">
        {{ t('matchResult.mutationNote') }}
      </div>

      <div class="flex gap-2.5 px-6 py-6">
        <button type="button" class="btn-ghost flex-1 py-3.5 text-[14px]" @click="phase = 'input'">← {{ t('common.back') }}</button>
        <NuxtLink :to="localePath('/test')" class="btn-ghost px-4 py-3.5 text-[14px]">{{ t('common.retake') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ap-range {
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  appearance: none;
  outline: none;
}
.ap-range::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f4efe6;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(201, 162, 75, 0.5);
}
.ap-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: #f4efe6;
  cursor: pointer;
}
</style>
