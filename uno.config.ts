import { defineConfig, presetUno, presetAttributify, transformerDirectives, transformerVariantGroup } from 'unocss'

// Design tokens — mirror of design/TOKENS.md §1–2. Single source for Uno + CSS vars.
export const tokens = {
  ink: '#0E1530', // 夜墨 Midnight Ink
  space: '#1B2452', // 深空 Deep Space
  bone: '#F4EFE6', // 骨白 Bone
  gold: '#C9A24B', // 星金 Star Gold
  fire: '#E2683C', // 火 Ember
  earth: '#8A9A5B', // 土 Sage
  air: '#9FC1D4', // 风 Mist
  water: '#2E7C8A', // 水 Tide
  // text greys (blue-grey ladder)
  'text-bright': '#cfd4ea',
  'text-muted': '#9aa3cc',
  'text-dim': '#7e88b4',
  'text-faint': '#6b76a8',
  'text-gold': '#cdbf9e',
} as const

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      ink: tokens.ink,
      space: tokens.space,
      bone: tokens.bone,
      gold: tokens.gold,
      fire: tokens.fire,
      earth: tokens.earth,
      air: tokens.air,
      water: tokens.water,
      muted: tokens['text-muted'],
      dim: tokens['text-dim'],
      faint: tokens['text-faint'],
    },
    fontFamily: {
      sans: "'Inter','Noto Sans SC',sans-serif",
      serif: "'Cormorant Garamond','Noto Serif SC',serif",
      'serif-sc': "'Noto Serif SC',serif",
      'serif-latin': "'Cormorant Garamond',serif",
      mono: "'IBM Plex Mono',monospace",
      symbol: "'Noto Sans Symbols 2',serif",
    },
  },
  shortcuts: {
    // panel / card chrome from prototype
    panel: 'bg-ink border border-[rgba(201,162,75,0.18)] rounded-3xl shadow-[0_40px_90px_rgba(0,0,0,0.5)] overflow-hidden text-bone font-sans',
    'card-inset': 'bg-[rgba(27,36,82,0.5)] border border-[rgba(201,162,75,0.14)] rounded-2xl',
    eyebrow: "font-mono text-[11px] tracking-[0.16em] uppercase text-gold",
    'btn-gold': 'border-none cursor-pointer bg-gold text-ink font-sans font-600 rounded-full',
    'btn-ghost': 'cursor-pointer bg-transparent text-bone font-sans font-500 rounded-full border border-[rgba(201,162,75,0.5)]',
    pill: 'rounded-full inline-flex items-center',
    disclaimer: 'text-[12px] text-faint',
  },
  safelist: [
    // element accent colours may be applied dynamically (per sign element)
    'text-fire', 'text-earth', 'text-air', 'text-water', 'text-gold',
    'bg-fire', 'bg-earth', 'bg-air', 'bg-water',
  ],
})
