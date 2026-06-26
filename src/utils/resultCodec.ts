// Compact, PII-free codec for ResultState → base64url (design/02 §7, §9).
// Binary packing keeps share URLs short; opening the link reproduces the result.
import type { Dim, MutationLevel, PersonalityVector, ResultState } from '~/core/types'
import { DIMS } from '~/core/types'
import { signIds } from '~/data'

const VERSION = 1
const toByte = (x: number) => Math.max(0, Math.min(255, Math.round(x * 255)))

function packVector(v: PersonalityVector): number[] {
  return DIMS.map((d) => toByte(v[d]))
}
function unpackVector(bytes: number[], off: number): PersonalityVector {
  const v = {} as PersonalityVector
  DIMS.forEach((d, i) => {
    v[d] = (bytes[off + i] ?? 128) / 255
  })
  return v
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ''
  for (const x of bytes) bin += String.fromCharCode(x)
  const b64 = typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToBytes(s: string): Uint8Array {
  const pad = (4 - (s.length % 4)) % 4
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function encodeResult(state: ResultState): string {
  const mutated = !!state.mutated
  const hasIdeal = !!state.ideal
  const bytes: number[] = [
    VERSION,
    Math.max(0, signIds.indexOf(state.sign)),
    state.ageBand & 0xff,
    (mutated ? 1 : 0) | (hasIdeal ? 2 : 0),
    mutated ? state.mutated!.level & 0xff : 0,
    mutated ? state.mutated!.dims.reduce((m, d) => m | (1 << DIMS.indexOf(d)), 0) : 0,
    ...packVector(state.v),
  ]
  if (hasIdeal) bytes.push(...packVector(state.ideal!))
  return bytesToB64url(Uint8Array.from(bytes))
}

export function decodeResult(s: string): ResultState | null {
  try {
    const bytes = Array.from(b64urlToBytes(s))
    if (bytes.length < 12 || bytes[0] !== VERSION) return null
    const sign = signIds[bytes[1] ?? 0] ?? signIds[0]!
    const ageBand = bytes[2] ?? 0
    const flags = bytes[3] ?? 0
    const state: ResultState = { v: unpackVector(bytes, 6), sign, ageBand }
    if (flags & 1) {
      const mask = bytes[5] ?? 0
      const dims = DIMS.filter((_, i) => mask & (1 << i)) as Dim[]
      state.mutated = { level: ((bytes[4] ?? 0) as MutationLevel), dims }
    }
    if (flags & 2) state.ideal = unpackVector(bytes, 12)
    return state
  } catch {
    return null
  }
}
