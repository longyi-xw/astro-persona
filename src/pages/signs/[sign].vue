<script setup lang="ts">
import { getCompat, getSignContent, getSignProfile, getSignProfiles, type Locale } from '~/content'
import { ELEMENT_COLOR, formatDateRange, textGlyph } from '~/utils/theme'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const id = String(route.params.sign)
const profile = getSignProfile(id)
if (!profile) throw createError({ statusCode: 404, statusMessage: 'Sign not found' })

const color = ELEMENT_COLOR[profile.element]
const content = computed(() => getSignContent(locale.value as Locale, id))
const altName = computed(() => getSignContent(locale.value === 'zh' ? 'en' : 'zh', id)?.name ?? '')

const ranked = getSignProfiles()
  .filter((s) => s.id !== id)
  .map((s) => ({ id: s.id, score: getCompat(id, s.id) }))
  .sort((a, b) => b.score - a.score)
const names = (list: { id: string }[]) => list.map((x) => getSignContent(locale.value as Locale, x.id)?.name ?? x.id).join(' ')
const compat = computed(() => ({
  high: names(ranked.slice(0, 3)),
  mid: names(ranked.slice(3, 5)),
  low: names(ranked.slice(-2)),
}))

useSeoMeta({
  title: () => `${content.value?.name} ${altName.value} · ${t('brand')}`,
  description: () => content.value?.summary ?? '',
})
</script>

<template>
  <article v-if="profile && content" class="max-w-2xl mx-auto px-0 sm:px-6 py-8">
    <div class="panel">
      <!-- header / archive -->
      <header class="relative px-7 pt-8 pb-7 border-b border-[rgba(201,162,75,0.12)]" :style="{ background: `linear-gradient(160deg, ${color}29, rgba(14,21,48,0) 60%)` }">
        <div class="flex items-start justify-between">
          <div>
            <div class="font-mono text-[11px] tracking-[0.18em] uppercase" :style="{ color }">
              {{ t('elementNames.' + profile.element) }} · {{ t('modality.' + profile.modality) }}
            </div>
            <h1 class="mt-3.5 mb-0 font-serif-sc font-600 text-[40px] leading-none">{{ content.name }}</h1>
            <p class="mt-1 font-serif-latin italic text-[26px] text-[#d7ccae]">{{ altName }}</p>
            <p class="mt-2 text-[13px] text-muted">{{ content.tagline }}</p>
          </div>
          <span class="font-symbol text-[62px] leading-none" :style="{ color, filter: `drop-shadow(0 0 18px ${color}66)` }">{{ textGlyph(profile.glyph) }}</span>
        </div>
        <dl class="grid grid-cols-2 gap-x-5 gap-y-3 mt-6 font-mono text-[11.5px]">
          <div class="flex items-baseline justify-between gap-2"><dt class="text-faint">{{ t('signDetail.dates') }}</dt><dd class="m-0 text-muted border-b border-dotted border-[rgba(201,162,75,0.35)] pb-0.5">{{ formatDateRange(profile.dateRange) }}</dd></div>
          <div class="flex items-baseline justify-between gap-2"><dt class="text-faint">{{ t('signDetail.ruler') }}</dt><dd class="m-0 text-muted border-b border-dotted border-[rgba(201,162,75,0.35)] pb-0.5">{{ content.rulingBody }}</dd></div>
          <div class="flex items-baseline justify-between gap-2"><dt class="text-faint">{{ t('signDetail.element') }}</dt><dd class="m-0 border-b border-dotted pb-0.5" :style="{ color, borderColor: color + '88' }">{{ t('elements.' + profile.element) }}</dd></div>
          <div class="flex items-baseline justify-between gap-2"><dt class="text-faint">{{ t('signDetail.mode') }}</dt><dd class="m-0 text-muted border-b border-dotted border-[rgba(201,162,75,0.35)] pb-0.5">{{ t('modality.' + profile.modality) }}</dd></div>
        </dl>
      </header>

      <!-- summary -->
      <section class="px-7 pt-6">
        <div class="eyebrow">{{ t('signDetail.sketch') }}</div>
        <p class="mt-3 text-[14.5px] leading-[1.8] text-[#cfd4ea]">{{ content.summary }}</p>
      </section>

      <!-- strengths / weaknesses -->
      <section class="grid grid-cols-2 gap-3.5 px-7 pt-5">
        <div>
          <div class="font-mono text-[11px] tracking-[0.14em] text-earth uppercase mb-2">{{ t('signDetail.strengths') }}</div>
          <ul class="m-0 pl-0 list-none flex flex-col gap-1.5">
            <li v-for="s in content.strengths" :key="s" class="text-[13px] text-[#cfd4ea] flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-earth flex-none" />{{ s }}</li>
          </ul>
        </div>
        <div>
          <div class="font-mono text-[11px] tracking-[0.14em] text-fire uppercase mb-2">{{ t('signDetail.weaknesses') }}</div>
          <ul class="m-0 pl-0 list-none flex flex-col gap-1.5">
            <li v-for="w in content.weaknesses" :key="w" class="text-[13px] text-muted flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-fire flex-none" />{{ w }}</li>
          </ul>
        </div>
      </section>

      <!-- baseline compass -->
      <section class="m-7 p-5 card-inset">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-mono text-[11px] tracking-[0.14em] text-gold">{{ t('signDetail.baseline') }}</span>
          <span class="font-mono text-[10.5px] text-faint">{{ t('signDetail.baselineNote', { name: content.name }) }}</span>
        </div>
        <div class="flex justify-center py-1.5">
          <div class="w-[230px] h-[230px]"><EnergyCompass :vector="profile.baseline" :size="230" :accent="color" show-labels /></div>
        </div>
      </section>

      <!-- love / career -->
      <section class="grid grid-cols-2 gap-3.5 px-7">
        <div>
          <div class="font-serif-sc text-[15px]">{{ t('signDetail.love') }}</div>
          <p class="mt-2 text-[12.5px] leading-[1.7] text-muted">{{ content.love }}</p>
        </div>
        <div>
          <div class="font-serif-sc text-[15px]">{{ t('signDetail.work') }}</div>
          <p class="mt-2 text-[12.5px] leading-[1.7] text-muted">{{ content.career }}</p>
        </div>
      </section>

      <!-- keywords -->
      <section class="px-7 pt-5">
        <div class="eyebrow mb-3">{{ t('signDetail.keywords') }}</div>
        <div class="flex flex-wrap gap-2">
          <span v-for="kw in content.keywords" :key="kw" class="px-3 py-1.5 rounded-full text-[12px]" :style="{ background: color + '1f', border: `1px solid ${color}59`, color }">{{ kw }}</span>
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
          <div class="font-serif-sc text-[16px]">{{ t('signDetail.ctaTitle', { name: content.name }) }}</div>
          <div class="text-[12px] text-muted mt-1">{{ t('signDetail.ctaSub', { name: altName, latin: altName }) }}</div>
        </div>
        <span class="btn-gold text-[13.5px] px-4.5 py-3 whitespace-nowrap">{{ t('signDetail.cta') }}</span>
      </NuxtLink>

      <p class="px-7 py-6 text-[11px] text-faint">{{ t('common.disclaimer') }}</p>
    </div>
  </article>
</template>
