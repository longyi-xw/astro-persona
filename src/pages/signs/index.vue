<script setup lang="ts">
import { signs, signText, type Locale } from '~/data'
import { ELEMENT_COLOR, textGlyph } from '~/utils/theme'
import type { Element } from '~/core/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water']
const other = computed<Locale>(() => (locale.value === 'zh' ? 'en' : 'zh'))

const groups = computed(() =>
  ELEMENTS.map((el) => ({
    el,
    color: ELEMENT_COLOR[el],
    label: t(`signsList.groups.${el}`),
    signs: signs
      .filter((s) => s.element === el)
      .map((s) => ({
        id: s.id,
        glyph: textGlyph(s.glyph),
        dates: `${s.dates.from}–${s.dates.to}`,
        name: signText(locale.value as Locale, s.id)?.name ?? s.id,
        alt: signText(other.value, s.id)?.name ?? '',
        keyword: signText(locale.value as Locale, s.id)?.keyword ?? '',
      })),
  })),
)

useSeoMeta({ title: () => `${t('signsList.title')} · ${t('brand')}`, description: () => t('signsList.intro') })
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 sm:px-8 py-10">
    <header class="mb-2">
      <h1 class="m-0 font-serif-sc font-600 text-[30px] leading-[1.2]">{{ t('signsList.title') }}</h1>
      <p class="mt-1.5 font-serif-latin italic text-[20px] text-[#cdbf9e]">{{ t('signsList.titleLatin') }}</p>
      <p class="mt-4 text-[13.5px] leading-[1.65] text-muted max-w-xl">{{ t('signsList.intro') }}</p>
    </header>

    <section v-for="g in groups" :key="g.el" class="mt-7">
      <div class="flex items-center gap-2.5 mb-3">
        <span class="w-1.5 h-1.5 rounded-full" :style="{ background: g.color }" />
        <span class="font-mono text-[12px] tracking-[0.14em]" :style="{ color: g.color }">{{ g.label }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <NuxtLink
          v-for="s in g.signs"
          :key="s.id"
          :to="localePath(`/signs/${s.id}`)"
          class="flex items-center gap-3.5 px-3.5 py-3 bg-[rgba(27,36,82,0.5)] rounded-xl border border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(27,36,82,0.8)]"
          :style="{ borderLeft: `2px solid ${g.color}` }"
        >
          <span class="font-symbol text-[23px] w-7 text-center" :style="{ color: g.color }">{{ s.glyph }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="font-serif-sc text-[16px]">{{ s.name }}</span>
              <span class="font-serif-latin italic text-[14px] text-muted">{{ s.alt }}</span>
            </div>
            <div class="text-[11.5px] text-[#8089b0] mt-0.5">{{ s.keyword }}</div>
          </div>
          <span class="font-mono text-[10.5px] text-faint">{{ s.dates }}</span>
        </NuxtLink>
      </div>
    </section>

    <p class="mt-9 text-[11px] text-faint">{{ t('signsList.note') }}</p>
  </div>
</template>
