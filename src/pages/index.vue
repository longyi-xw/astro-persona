<script setup lang="ts">
import { getSignContent, getSignProfiles, type Locale } from '~/content'
import { ELEMENT_COLOR } from '~/utils/theme'
import type { Element, PersonalityVector } from '~/core/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const heroVector: PersonalityVector = { fire: 0.78, earth: 0.5, air: 0.62, water: 0.44, expr: 0.6, order: 0.5 }
const teaserVector: PersonalityVector = { fire: 0.92, earth: 0.2, air: 0.72, water: 0.24, expr: 0.84, order: 0.3 }

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water']
const groups = computed(() =>
  ELEMENTS.map((el) => ({
    el,
    color: ELEMENT_COLOR[el],
    blurb: t(`home.elementBlurb.${el}`),
    names: getSignProfiles()
      .filter((s) => s.element === el)
      .map((s) => getSignContent(locale.value as Locale, s.id)?.name)
      .join(' · '),
  })),
)

useSeoMeta({
  title: () => `${t('brand')} · ${t('home.title').replace('\n', '')}`,
  description: () => t('home.desc'),
  ogTitle: () => t('home.title').replace('\n', ' '),
  ogDescription: () => t('home.desc'),
})
</script>

<template>
  <div>
    <section class="starfield">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-[1.12fr_0.88fr] gap-6 items-center px-6 sm:px-12 pt-14 pb-12">
        <div>
          <div class="eyebrow tracking-[0.22em] mb-5">{{ t('home.eyebrow') }}</div>
          <h1 class="m-0 font-serif-sc font-600 text-[40px] sm:text-[58px] leading-[1.12] whitespace-pre-line">{{ t('home.title') }}</h1>
          <p class="mt-4 font-serif-latin italic font-500 text-[22px] sm:text-[28px] leading-[1.28] text-[#d7ccae] whitespace-pre-line">{{ t('home.titleLatin') }}</p>
          <p class="mt-6 max-w-[440px] text-[15px] sm:text-[16px] leading-[1.7] text-muted">
            {{ t('home.desc') }}<br><span class="text-dim">{{ t('home.descLatin') }}</span>
          </p>
          <div class="flex gap-3.5 mt-9 flex-wrap">
            <NuxtLink :to="localePath('/test')" class="btn-gold text-[15px] px-6 py-3.5">{{ t('home.ctaTest') }}</NuxtLink>
            <NuxtLink :to="localePath('/signs')" class="btn-ghost text-[15px] px-6 py-3.5">{{ t('home.ctaSigns') }}</NuxtLink>
          </div>
        </div>
        <div class="flex justify-center items-center">
          <div class="w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]" style="filter: drop-shadow(0 0 42px rgba(201,162,75,0.25))">
            <EnergyCompass :vector="heroVector" :size="360" accent="#C9A24B" />
          </div>
        </div>
      </div>

      <div class="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3.5 px-6 sm:px-12">
        <NuxtLink
          v-for="g in groups"
          :key="g.el"
          :to="localePath('/signs')"
          class="p-4 rounded-2xl bg-[rgba(27,36,82,0.55)] transition-transform hover:-translate-y-0.5"
          :style="{ border: `1px solid ${g.color}47` }"
        >
          <div class="font-mono text-[11.5px] tracking-[0.12em]" :style="{ color: g.color }">{{ t('elements.' + g.el) }} · {{ t('signsList.groups.' + g.el) }}</div>
          <div class="font-serif-sc text-[17px] mt-2.5">{{ g.blurb }}</div>
          <div class="text-[12px] text-muted mt-1.5 leading-[1.5]">{{ g.names }}</div>
        </NuxtLink>
      </div>

      <div class="max-w-6xl mx-auto px-6 sm:px-12 mt-9 pb-12">
        <div class="flex items-center gap-6 p-5 sm:px-6 rounded-[18px] bg-[rgba(27,36,82,0.6)] border border-[rgba(201,162,75,0.16)]">
          <div class="w-[92px] h-[92px] flex-none hidden sm:block">
            <EnergyCompass :vector="teaserVector" :baseline="heroVector" :size="92" accent="#E2683C" />
          </div>
          <div>
            <div class="font-mono text-[11px] tracking-[0.18em] uppercase text-gold">{{ t('home.driftLabel') }}</div>
            <div class="font-serif-sc text-[19px] mt-2">{{ t('home.driftTitle') }}</div>
            <div class="text-[13px] text-muted mt-1.5 leading-[1.6] max-w-[600px]">{{ t('home.driftDesc') }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
