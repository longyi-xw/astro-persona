// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EnergyCompass from '~/components/EnergyCompass.vue'
import type { PersonalityVector } from '~/core/types'

const v: PersonalityVector = { fire: 0.9, earth: 0.3, air: 0.6, water: 0.2, expr: 0.7, order: 0.4 }

describe('EnergyCompass', () => {
  it('renders one data polygon and six axis nodes by default', () => {
    const w = mount(EnergyCompass, { props: { vector: v, size: 200 } })
    expect(w.findAll('polygon')).toHaveLength(1)
    // 6 axis nodes + veil + 3 rings + core = 11 circles
    expect(w.findAll('circle').length).toBe(11)
  })

  it('overlays a dashed baseline polygon when a baseline is given', () => {
    const baseline: PersonalityVector = { fire: 0.8, earth: 0.46, air: 0.54, water: 0.36, expr: 0.66, order: 0.52 }
    const w = mount(EnergyCompass, { props: { vector: v, baseline, size: 200 } })
    const polys = w.findAll('polygon')
    expect(polys).toHaveLength(2)
    expect(polys[0]!.attributes('stroke-dasharray')).toBeTruthy() // baseline drawn first, dashed
  })

  it('places the fire axis at the top and reflects the score radius', () => {
    const w = mount(EnergyCompass, { props: { vector: v, size: 200, animate: false } })
    // fire is dim 0 at angle -90° → straight up from centre (cx=cy=100, R=72)
    const pts = w.find('polygon').attributes('points')!.split(' ').map((p) => p.split(',').map(Number))
    const [fx, fy] = pts[0]!
    expect(fx).toBeCloseTo(100, 4) // centred horizontally
    expect(fy).toBeCloseTo(100 - 72 * 0.9, 4) // up by R*value
  })

  it('shows six localized axis labels when enabled', () => {
    const w = mount(EnergyCompass, { props: { vector: v, size: 200, showLabels: true } })
    const texts = w.findAll('text').map((t) => t.text())
    expect(texts).toEqual(['火', '土', '风', '水', '显', '序'])
  })
})
