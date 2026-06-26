<script setup lang="ts">
// Offscreen vertical share card (design frames 10–12). Rendered to PNG by
// useShareCard; positioned offscreen so it never flashes on the page.
import { textGlyph } from '~/utils/theme'
import type { PersonalityVector } from '~/core/types'

defineProps<{
  vector: PersonalityVector
  archetype: { name: string; latin: string }
  keywords: string[]
  glyph: string
  accent: string
  driftLabel: string
  driftColor: string
}>()
</script>

<template>
  <div
    class="share-card"
    :style="{
      backgroundColor: '#0E1530',
      backgroundImage: `radial-gradient(120% 80% at 50% 6%, ${accent}38, transparent 55%)`,
      border: `1px solid ${accent}59`,
    }"
  >
    <div class="flex items-center justify-between w-full">
      <span class="font-serif-latin font-700 text-[14px] tracking-wide text-gold">Astro Persona</span>
      <span class="font-symbol text-[30px] leading-none" :style="{ color: accent, filter: `drop-shadow(0 0 14px ${accent}80)` }">{{ textGlyph(glyph) }}</span>
    </div>

    <div class="mt-3.5 w-[248px] h-[248px]" :style="{ filter: `drop-shadow(0 0 34px ${accent}66)` }">
      <EnergyCompass :vector="vector" :size="248" :accent="accent" :animate="false" />
    </div>

    <div class="inline-flex items-center gap-1.5 mt-4 px-3.5 py-1.5 rounded-full" :style="{ background: accent + '2e', border: `1px solid ${accent}8c` }">
      <span class="w-1.5 h-1.5 rounded-full" :style="{ background: accent }" />
      <span class="font-mono text-[11px] tracking-[0.06em]" :style="{ color: driftColor }">{{ driftLabel }}</span>
    </div>

    <h2 class="mt-4 mb-0 font-serif-sc font-600 text-[34px] leading-none text-center pb-2.5" :style="{ borderBottom: `2px solid ${accent}` }">{{ archetype.name }}</h2>
    <p class="mt-2.5 font-serif-latin italic text-[22px] text-[#d7ccae]">{{ archetype.latin }}</p>

    <div class="flex gap-2 mt-5">
      <span v-for="kw in keywords" :key="kw" class="font-mono text-[12px] px-3 py-1.5 rounded-full" :style="{ color: driftColor, border: `1px solid ${accent}80` }">{{ kw }}</span>
    </div>

    <div class="mt-auto flex items-center justify-between w-full pt-5 border-t border-[rgba(255,255,255,0.08)]">
      <span class="font-serif-latin italic text-[13px] text-[#8089b0]">Your sign is a starting point</span>
      <span class="font-mono text-[10.5px] text-faint">astropersona.app</span>
    </div>
  </div>
</template>

<style scoped>
.share-card {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 380px;
  min-height: 640px;
  border-radius: 26px;
  overflow: hidden;
  color: #f4efe6;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
}
</style>
