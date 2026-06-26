<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSession } from '~/stores/session'
import { config, neutral, questionText, signById, signs, signText, type Locale } from '~/data'
import { effectiveBaseline } from '~/core/age'
import { detectMutation } from '~/core/mutation'
import { encodeResult } from '~/utils/resultCodec'
import { ELEMENT_COLOR, textGlyph } from '~/utils/theme'
import type { ResultState } from '~/core/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const store = useSession()
const { sign, ageBand, tier, vector, total } = storeToRefs(store)

type Phase = 'intro' | 'run' | 'generating'
const phase = ref<Phase>('intro')
const index = ref(0)

// preset sign from a sign-detail CTA (?sign=aries)
if (typeof route.query.sign === 'string' && signById(route.query.sign)) sign.value = route.query.sign

const ageBands = config.age.bands
const signPicker = computed(() =>
  signs.map((s) => ({ id: s.id, glyph: textGlyph(s.glyph), color: ELEMENT_COLOR[s.element], name: signText(locale.value as Locale, s.id)?.name ?? s.id })),
)

const current = computed(() => store.tierQuestions[index.value])
const currentText = computed(() => (current.value ? questionText(locale.value as Locale, current.value.id) : undefined))
const progress = computed(() => Math.round(((index.value) / Math.max(1, total.value)) * 100))

function start() {
  store.reset()
  index.value = 0
  phase.value = 'run'
}

function choose(optionId: string) {
  const q = current.value
  if (!q) return
  store.answer(q.id, optionId)
  if (index.value < total.value - 1) index.value++
  else finish()
}

function prev() {
  if (index.value > 0) index.value--
}

function finish() {
  phase.value = 'generating'
  const profile = signById(sign.value)
  if (!profile) return
  const eff = effectiveBaseline(profile.baseline, neutral, ageBand.value, config)
  const mut = detectMutation(vector.value, eff, ageBand.value, config)
  const state: ResultState = {
    v: vector.value,
    sign: sign.value,
    ageBand: ageBand.value,
    mutated: mut.isMutated ? { level: mut.level, dims: mut.drivers } : undefined,
    ideal: store.ideal ?? undefined,
  }
  const token = encodeResult(state)
  const go = () => navigateTo(localePath({ path: '/result', query: { s: token } }))
  if (import.meta.client) window.setTimeout(go, 1600)
  else go()
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 sm:px-6 py-8">
    <!-- ===== INTRO ===== -->
    <div v-if="phase === 'intro'" class="panel px-6 sm:px-7 py-8">
      <h1 class="m-0 font-serif-sc font-600 text-[28px] leading-[1.2]">{{ t('testIntro.title') }}</h1>
      <p class="mt-1 font-serif-latin italic text-[20px] text-[#cdbf9e]">{{ t('testIntro.titleLatin') }}</p>

      <!-- sign -->
      <div class="mt-7">
        <div class="eyebrow">{{ t('nav.signs') }}</div>
        <div class="flex flex-wrap gap-2 mt-3.5">
          <button
            v-for="s in signPicker"
            :key="s.id"
            type="button"
            class="w-10 h-10 rounded-full font-symbol text-[20px] flex items-center justify-center transition-colors"
            :style="sign === s.id
              ? { color: '#0E1530', background: s.color, borderColor: s.color }
              : { color: s.color, border: '1px solid rgba(255,255,255,0.12)' }"
            :aria-label="s.name"
            @click="sign = s.id"
          >{{ s.glyph }}</button>
        </div>
      </div>

      <!-- age band -->
      <div class="mt-7">
        <div class="eyebrow">{{ t('testIntro.ageBand') }}</div>
        <div class="text-[12px] text-dim mt-1.5">{{ t('testIntro.ageNote') }}</div>
        <div class="flex flex-wrap gap-2 mt-3.5">
          <button
            v-for="(b, i) in ageBands"
            :key="b.id"
            type="button"
            class="px-4 py-2 rounded-full text-[13px] transition-colors"
            :class="ageBand === i ? 'bg-[rgba(201,162,75,0.16)] text-bone font-600 border border-gold' : 'text-muted border border-[rgba(255,255,255,0.12)]'"
            @click="ageBand = i"
          >{{ b.id }}</button>
        </div>
      </div>

      <!-- length -->
      <div class="mt-7">
        <div class="eyebrow">{{ t('testIntro.length') }}</div>
        <div class="flex gap-2.5 mt-3.5">
          <button type="button" class="flex-1 p-4 rounded-2xl text-left transition-colors" :class="tier === 'quick' ? 'border border-gold bg-[rgba(201,162,75,0.14)]' : 'border border-[rgba(255,255,255,0.12)] bg-[rgba(27,36,82,0.5)]'" @click="tier = 'quick'">
            <div class="font-serif-sc text-[16px]">{{ t('testIntro.quick') }}</div>
            <div class="text-[12px] text-muted mt-1">{{ t('testIntro.quickNote') }}</div>
          </button>
          <button type="button" class="flex-1 p-4 rounded-2xl text-left transition-colors" :class="tier === 'full' ? 'border border-gold bg-[rgba(201,162,75,0.14)]' : 'border border-[rgba(255,255,255,0.12)] bg-[rgba(27,36,82,0.5)]'" @click="tier = 'full'">
            <div class="font-serif-sc text-[16px]">{{ t('testIntro.full') }}</div>
            <div class="text-[12px] text-[#d7ccae] mt-1">{{ t('testIntro.fullNote') }}</div>
          </button>
        </div>
      </div>

      <button type="button" class="btn-gold w-full mt-8 py-4 text-[15px]" @click="start">{{ t('testIntro.begin') }}</button>
      <p class="mt-4 text-[11px] text-faint text-center leading-[1.6]">{{ t('testIntro.note') }}</p>
    </div>

    <!-- ===== RUN ===== -->
    <div v-else-if="phase === 'run' && current && currentText" class="panel starfield px-6 sm:px-7 pt-6 pb-7">
      <div class="flex items-center justify-between font-mono text-[12px] text-muted">
        <button type="button" class="text-faint disabled:opacity-40" :disabled="index === 0" @click="prev">← {{ t('testRun.prev') }}</button>
        <span><span class="text-gold">{{ String(index + 1).padStart(2, '0') }}</span> / {{ total }}</span>
      </div>
      <div class="mt-3.5 h-1 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
        <div class="h-full rounded-full transition-all duration-300" :style="{ width: progress + '%', background: 'linear-gradient(90deg,#C9A24B,#E2683C)' }" />
      </div>

      <div class="pt-10">
        <div class="eyebrow mb-4">{{ t('testRun.scenario') }}</div>
        <h2 class="m-0 font-serif-sc font-500 text-[24px] leading-[1.45]">{{ currentText.scenario }}</h2>

        <div class="flex flex-col gap-3 mt-8">
          <button
            v-for="(opt, i) in current.options"
            :key="opt.id"
            type="button"
            class="p-5 rounded-2xl flex items-center gap-4 text-left transition-colors"
            :class="store.answers[current.id] === opt.id ? 'border border-gold bg-[rgba(201,162,75,0.12)]' : 'border border-[rgba(255,255,255,0.1)] bg-[rgba(27,36,82,0.5)] hover:border-[rgba(201,162,75,0.4)]'"
            @click="choose(opt.id)"
          >
            <span class="font-mono text-[15px] w-7.5 h-7.5 rounded-full flex items-center justify-center flex-none" :class="store.answers[current.id] === opt.id ? 'bg-gold text-ink font-600' : 'text-muted border border-[rgba(255,255,255,0.2)]'">{{ String.fromCharCode(65 + i) }}</span>
            <span class="text-[15px] leading-[1.5]">{{ currentText.options[opt.id] }}</span>
          </button>
        </div>
      </div>
      <p class="mt-7 text-[11px] text-faint text-center">{{ t('testRun.hint') }}</p>
    </div>

    <!-- ===== GENERATING ===== -->
    <div v-else class="panel starfield flex flex-col items-center justify-center text-center px-6 py-14 min-h-[560px]">
      <div class="w-[240px] h-[240px]" style="filter: drop-shadow(0 0 36px rgba(201,162,75,0.3))">
        <EnergyCompass :vector="vector" :size="240" accent="#C9A24B" />
      </div>
      <h2 class="mt-10 font-serif-sc font-500 text-[24px]">{{ t('generating.title') }}</h2>
      <p class="mt-2.5 font-serif-latin italic text-[20px] text-[#cdbf9e]">{{ t('generating.titleLatin') }}</p>
      <p class="mt-7 text-[11.5px] text-faint leading-[1.7] max-w-[300px]">{{ t('generating.note') }}</p>
    </div>
  </div>
</template>
