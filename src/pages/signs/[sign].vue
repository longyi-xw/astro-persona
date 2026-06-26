<script setup lang="ts">
import { compatMatrix, signById, signText, signs, type Locale } from '~/data'
import { ELEMENT_COLOR, textGlyph } from '~/utils/theme'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const id = String(route.params.sign)
const profile = signById(id)
if (!profile) throw createError({ statusCode: 404, statusMessage: 'Sign not found' })

const color = ELEMENT_COLOR[profile.element]
const text = computed(() => signText(locale.value as Locale, id))
const altName = computed(() => signText(locale.value === 'zh' ? 'en' : 'zh', id)?.name ?? '')

const ranked = signs
  .filter((s) => s.id !== id)
  .map((s) => ({ id: s.id, score: compatMatrix[id]?.[s.id] ?? 0.55 }))
  .sort((a, b) => b.score - a.score)
const names = (list: { id: string }[]) => list.map((x) => signText(locale.value as Locale, x.id)?.name ?? x.id).join(' ')
const compat = computed(() => ({
  high: names(ranked.slice(0, 3)),
  mid: names(ranked.slice(3, 5)),
  low: names(ranked.slice(-2)),
}))

useSeoMeta({
  title: () => `${text.value?.name} ${altName.value} · ${t('brand')}`,
  description: () => text.value?.sketch?.[0] ?? '',
})
</script>

<template>
  <article v-if="profile && text" class="max-w-2xl mx-auto px-0 sm:px-6 py-8">
    <div class="panel">
      <!-- header / archive -->
      <header class="relative px-7 pt-8 pb-7 border-b border-[rgba(201,162,75,0.12)]" :style="{ background: `linear-gradient(160deg, ${color}29, rgba(14,21,48,0) 60%)` }">
        <div class="flex items-start justify-between">
          <div>
            <div class="font-mono text-[11px] tracking-[0.18em] uppercase" :style="{ color }">
              {{ t('elementNames.' + profile.element) }} · {{ t('modality.' + profile.modality) }}
            </div>
            <h1 class="mt-3.5 mb-0 font-serif-sc font-600 text-[40px] leading-none">{{ text.name }}</h1>
            <p class="mt-1 font-serif-latin italic text-[26px] text-[#d7ccae]">{{ altName }}</p>
          </div>
          <span class="font-symbol text-[62px] leading-none" :style="{ color, filter: `drop-shadow(0 0 18px ${color}66)` }">{{ textGlyph(profile.glyph) }}</span>
        </div>
        <dl class="grid grid-cols-2 gap-x-5 gap-y-2 mt-6 font-mono text-[11.5px] text-muted">
          <div class="flex justify-between border-b border-dotted border-[rgba(255,255,255,0.12)] pb-1.5"><dt class="text-faint">{{ t('signDetail.dates') }}</dt><dd class="m-0">{{ profile.dates.from }}–{{ profile.dates.to }}</dd></div>
          <div class="flex justify-between border-b border-dotted border-[rgba(255,255,255,0.12)] pb-1.5"><dt class="text-faint">{{ t('signDetail.ruler') }}</dt><dd class="m-0">{{ t('rulers.' + profile.ruler) }}</dd></div>
          <div class="flex justify-between border-b border-dotted border-[rgba(255,255,255,0.12)] pb-1.5"><dt class="text-faint">{{ t('signDetail.element') }}</dt><dd class="m-0" :style="{ color }">{{ t('elements.' + profile.element) }}</dd></div>
          <div class="flex justify-between border-b border-dotted border-[rgba(255,255,255,0.12)] pb-1.5"><dt class="text-faint">{{ t('signDetail.mode') }}</dt><dd class="m-0">{{ t('modality.' + profile.modality) }}</dd></div>
        </dl>
      </header>

      <!-- sketch -->
      <section class="px-7 pt-6">
        <div class="eyebrow">{{ t('signDetail.sketch') }}</div>
        <p v-for="(para, i) in text.sketch" :key="i" class="mt-3 text-[14.5px] leading-[1.8] text-[#cfd4ea]">{{ para }}</p>
      </section>

      <!-- baseline compass -->
      <section class="m-7 p-5 card-inset">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-mono text-[11px] tracking-[0.14em] text-gold">{{ t('signDetail.baseline') }}</span>
          <span class="font-mono text-[10.5px] text-faint">{{ t('signDetail.baselineNote', { name: text.name }) }}</span>
        </div>
        <div class="flex justify-center py-1.5">
          <div class="w-[230px] h-[230px]"><EnergyCompass :vector="profile.baseline" :size="230" :accent="color" show-labels /></div>
        </div>
      </section>

      <!-- love / work -->
      <section class="grid grid-cols-2 gap-3.5 px-7">
        <div>
          <div class="font-serif-sc text-[15px]">{{ t('signDetail.love') }}</div>
          <p class="mt-2 text-[12.5px] leading-[1.7] text-muted">{{ text.love }}</p>
        </div>
        <div>
          <div class="font-serif-sc text-[15px]">{{ t('signDetail.work') }}</div>
          <p class="mt-2 text-[12.5px] leading-[1.7] text-muted">{{ text.work }}</p>
        </div>
      </section>

      <!-- compatibility -->
      <section class="px-7 pt-6">
        <div class="eyebrow mb-3">{{ t('signDetail.compat') }}</div>
        <div class="flex gap-2">
          <div class="flex-1 p-3 rounded-xl text-center bg-[rgba(46,124,138,0.14)] border border-[rgba(159,193,212,0.3)]">
            <div class="text-[12px] text-air">{{ t('signDetail.high') }}</div>
            <div class="text-[12.5px] mt-1.5 text-[#cfd4ea]">{{ compat.high }}</div>
          </div>
          <div class="flex-1 p-3 rounded-xl text-center bg-[rgba(201,162,75,0.1)] border border-[rgba(201,162,75,0.28)]">
            <div class="text-[12px] text-gold">{{ t('signDetail.mid') }}</div>
            <div class="text-[12.5px] mt-1.5 text-[#cfd4ea]">{{ compat.mid }}</div>
          </div>
          <div class="flex-1 p-3 rounded-xl text-center bg-[rgba(226,104,60,0.12)] border border-[rgba(226,104,60,0.3)]">
            <div class="text-[12px] text-fire">{{ t('signDetail.low') }}</div>
            <div class="text-[12.5px] mt-1.5 text-[#cfd4ea]">{{ compat.low }}</div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <NuxtLink
        :to="localePath({ path: '/test', query: { sign: id } })"
        class="mx-7 mt-6 mb-0 p-5 flex items-center justify-between gap-3.5 rounded-2xl"
        style="background: linear-gradient(120deg, rgba(201,162,75,0.16), rgba(201,162,75,0.04)); border: 1px solid rgba(201,162,75,0.3)"
      >
        <div>
          <div class="font-serif-sc text-[16px]">{{ t('signDetail.ctaTitle', { name: text.name }) }}</div>
          <div class="text-[12px] text-muted mt-1">{{ t('signDetail.ctaSub', { name: altName, latin: altName }) }}</div>
        </div>
        <span class="btn-gold text-[13.5px] px-4.5 py-3 whitespace-nowrap">{{ t('signDetail.cta') }}</span>
      </NuxtLink>

      <p class="px-7 py-6 text-[11px] text-faint">{{ t('common.disclaimer') }}</p>
    </div>
  </article>
</template>
