<script setup lang="ts">
// 六维能量罗盘 — 全站签名元素。Ported 1:1 from design/.../EnergyCompass.dc.html.
import { computed, useId } from 'vue'
import type { Dim, PersonalityVector } from '~/core/types'

const props = withDefaults(
  defineProps<{
    vector: PersonalityVector
    baseline?: PersonalityVector | null
    size?: number
    accent?: string
    showLabels?: boolean
    animate?: boolean
    labels?: Partial<Record<Dim, string>>
    ariaLabel?: string
  }>(),
  { baseline: null, size: 320, accent: '#C9A24B', showLabels: false, animate: true, labels: undefined, ariaLabel: undefined },
)

const DIMS: Dim[] = ['fire', 'earth', 'air', 'water', 'expr', 'order']
const COLORS: Record<Dim, string> = {
  fire: '#E2683C', earth: '#8A9A5B', air: '#9FC1D4', water: '#2E7C8A', expr: '#C9A24B', order: '#C9A24B',
}
const DEFAULT_LABELS: Record<Dim, string> = { fire: '火', earth: '土', air: '风', water: '水', expr: '显', order: '序' }

const clamp = (x: number) => Math.min(1, Math.max(0, x))

// unique ids so multiple compasses on one page don't share filter/gradient defs
const uid = useId()
const glowId = `cg-glow-${uid}`
const veilId = `cg-veil-${uid}`

const geo = computed(() => {
  const size = props.size
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.36
  const v = props.vector
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180
  const at = (val: number, i: number, rad: number): [number, number] => [
    cx + rad * val * Math.cos(ang(i)),
    cy + rad * val * Math.sin(ang(i)),
  ]

  const axes = DIMS.map((d, i) => {
    const [x, y] = at(1, i, R)
    const [dx, dy] = at(clamp(v[d]), i, R)
    const [lx, ly] = at(1.2, i, R)
    return { x, y, dx, dy, lx, ly, color: COLORS[d], label: props.labels?.[d] ?? DEFAULT_LABELS[d] }
  })

  const ptsOf = (vec: PersonalityVector) => DIMS.map((d, i) => at(clamp(vec[d]), i, R).join(',')).join(' ')

  return {
    cx, cy,
    outerR: R * 1.05,
    rings: [R * 0.34, R * 0.67, R],
    axes,
    dataPts: ptsOf(v),
    baselinePts: props.baseline ? ptsOf(props.baseline) : '',
    strokeW: Math.max(1.4, size * 0.007),
    baseStroke: Math.max(1, size * 0.004),
    dash: `${size * 0.018} ${size * 0.018}`,
    nodeR: Math.max(2, size * 0.013),
    coreR: Math.max(1.5, size * 0.01),
    blur: size * 0.008,
    labelSize: size * 0.05,
  }
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${size} ${size}`"
    width="100%"
    height="100%"
    style="display: block; overflow: visible"
    role="img"
    :aria-label="ariaLabel ?? 'Energy compass'"
  >
    <defs>
      <filter :id="glowId" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur :stdDeviation="geo.blur" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient :id="veilId" cx="50%" cy="50%" r="50%">
        <stop offset="0%" :stop-color="accent" stop-opacity="0.10" />
        <stop offset="100%" :stop-color="accent" stop-opacity="0" />
      </radialGradient>
    </defs>

    <circle :cx="geo.cx" :cy="geo.cy" :r="geo.outerR" :fill="`url(#${veilId})`" />

    <circle
      v-for="(r, i) in geo.rings"
      :key="`ring-${i}`"
      :cx="geo.cx"
      :cy="geo.cy"
      :r="r"
      fill="none"
      stroke="#C9A24B"
      stroke-opacity="0.14"
      stroke-width="1"
    />

    <line
      v-for="(ax, i) in geo.axes"
      :key="`axis-${i}`"
      :x1="geo.cx"
      :y1="geo.cy"
      :x2="ax.x"
      :y2="ax.y"
      stroke="#C9A24B"
      stroke-opacity="0.20"
      stroke-width="1"
    />

    <polygon
      v-if="geo.baselinePts"
      :points="geo.baselinePts"
      fill="none"
      stroke="#9FC1D4"
      stroke-opacity="0.6"
      :stroke-width="geo.baseStroke"
      :stroke-dasharray="geo.dash"
      stroke-linejoin="round"
    />

    <polygon
      :class="['compass-data', { 'compass-data--in': animate }]"
      :points="geo.dataPts"
      :fill="accent"
      fill-opacity="0.16"
      :stroke="accent"
      :stroke-width="geo.strokeW"
      stroke-linejoin="round"
      :filter="`url(#${glowId})`"
    />

    <circle
      v-for="(ax, i) in geo.axes"
      :key="`node-${i}`"
      :cx="ax.dx"
      :cy="ax.dy"
      :r="geo.nodeR"
      :fill="ax.color"
    />

    <circle :cx="geo.cx" :cy="geo.cy" :r="geo.coreR" :fill="accent" fill-opacity="0.9" :filter="`url(#${glowId})`" />

    <template v-if="showLabels">
      <text
        v-for="(ax, i) in geo.axes"
        :key="`label-${i}`"
        :x="ax.lx"
        :y="ax.ly"
        fill="#F4EFE6"
        fill-opacity="0.78"
        :font-size="geo.labelSize"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="'IBM Plex Mono', monospace"
        letter-spacing="0.04em"
      >
        {{ ax.label }}
      </text>
    </template>
  </svg>
</template>

<style scoped>
.compass-data {
  transform-box: fill-box;
  transform-origin: center;
}
@media (prefers-reduced-motion: no-preference) {
  .compass-data--in {
    animation: compass-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
}
@keyframes compass-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
