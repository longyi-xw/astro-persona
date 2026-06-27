// Shared accent lookups mirroring design/TOKENS.md (for inline SVG/data colours).
import type { Dim, Element, MutationLevel } from '~/core/types'

export const GOLD = '#C9A24B'
export const ELEMENT_COLOR: Record<Element, string> = {
  fire: '#E2683C',
  earth: '#8A9A5B',
  air: '#9FC1D4',
  water: '#2E7C8A',
}
export const DIM_COLOR: Record<Dim, string> = {
  fire: '#E2683C',
  earth: '#8A9A5B',
  air: '#9FC1D4',
  water: '#2E7C8A',
  expr: GOLD,
  order: GOLD,
}
/** Lifted/legible variants of the element colours for badge text on dark. */
export const ELEMENT_TEXT: Record<Element, string> = {
  fire: '#F0B59A',
  earth: '#B7C089',
  air: '#BBD4E2',
  water: '#7FC0CC',
}

export const driftKey = (level: MutationLevel): '0' | '1' | '2' | '3' =>
  String(level) as '0' | '1' | '2' | '3'

/** Append U+FE0E so zodiac glyphs render as text, not colour emoji. */
export const textGlyph = (glyph: string): string => `${glyph}︎`

/** [m,d]→[m,d] → "MM.DD–MM.DD". */
export const formatDateRange = (r: { start: [number, number]; end: [number, number] }): string => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(r.start[0])}.${p(r.start[1])}–${p(r.end[0])}.${p(r.end[1])}`
}
