# 星座百科 · Astro Persona

A global, bilingual (简体中文 / English) astrology **personality** site — reads like a
high-end astrology magazine, works like a precise personality instrument. Jamstack:
SSG content pages + **client-side pure-function** scoring, no backend, no PII.

> Built from the spec in [`design/`](./design): SRS, technical design, design system,
> and the Claude-Code workflow. Visual source of truth: the Claude Design prototype,
> distilled into [`design/TOKENS.md`](./design/TOKENS.md).

## What's here

- **Twelve-sign encyclopedia** — SEO-friendly, independently indexable, bilingual, each with a consensus-baseline EnergyCompass.
- **Personality test** — situational questions → a six-dimension energy chart (火/土/风/水 + 内显↔外显 + 守序↔混沌), an original archetype name, and keywords. No four-letter codes.
- **Age factor + drift (异变)** — older users lean less on the sign; when the measured vector strays far enough from the age-adjusted baseline, you're described by who you actually are. Mutation rate is calibrated to **15–30%**.
- **Compatibility matching** — classic element aspects + personality (similarity & complement) + optional ideal-type; a drifted user's weighting shifts from sign toward real personality.
- **Share & reproduce** — result encoded into the URL (base64url, no PII); a client-rendered PNG share card via Web Share API / download.

## The signature element

The **EnergyCompass** (`src/components/EnergyCompass.vue`) is a six-axis SVG radar —
the functional core (shows dimension scores), the visual signature, and the star of the
share card. Ported 1:1 from the prototype; supports an overlaid baseline (solid user /
dashed reference) and respects `prefers-reduced-motion`.

## Architecture — three iron rules

1. **Algorithms are pure functions** (`src/core/*`) — no framework/DOM/content imports; all data is injected as parameters; locked by Vitest. The single content entry (`src/content`, **zod-validated on load**) injects it; core & components never import `content/*.json` directly.
2. **Content / copy / weights are external** (`content/*`) — zh/en paired by stable `id`; algorithms know only `id`. UI chrome lives in `src/locales`; domain copy in `content/copy` is produced through `src/narrative`.
3. **No backend, no secrets in the frontend** — results reproduce from the URL. The LLM narrative is interface-only (`VITE_USE_LLM`), degrading to the template provider.

```
content/            版本化内容与配置（zod 校验，非工程可改）
  signs/            profiles.json (元素/三态/守护/日期/baseline) + zh/en.json (展示)
  questions/        items.json (16 题权重) + zh/en.json (题面)
  copy/             zh/en.json — 原型名 · 关键词 · 异变激励语(多变体) · 匹配解释
  config/           weights.json (年龄α/异变阈值/匹配权重) + compat-matrix.json (生成)
src/
  core/             纯函数 + content.schema(zod)：personality · age · mutation · matching
  content/          唯一数据入口：校验 + 派生量缓存(maxScores/neutral) + 强类型 getter
  narrative/        NarrativeProvider 接口 + Template(启用) + LLM(stub) + 工厂
  components/        EnergyCompass · ShareCard
  composables/       useShareCard
  stores/            session (Pinia)
  pages/             index · signs/ · test · result · match
  locales/           zh.ts · en.ts (UI chrome)
tests/              Vitest：算法 + 校准 + 文案 + 组件 + 编解码 + 内容校验 + 端到端
```

## Commands

```bash
pnpm install
pnpm dev          # dev server
pnpm test         # Vitest (core algorithms, calibration, narrative, codec, compass)
pnpm typecheck    # nuxt typecheck (vue-tsc, strict)
pnpm lint         # eslint
pnpm generate     # static build → .output/public (dist symlink)
pnpm gen:compat   # regenerate content/config/compat-matrix.json
pnpm check        # lint + typecheck + test (run before committing)
```

## Calibration

`content/config/weights.json` holds the tunable parameters (age α breakpoints, mutation `tauBase`/`beta`,
match weights). Editing it is **calibration** — `tests/calibration.test.ts` builds an N≥2000 synthetic
population and asserts the mutation rate stays in **15–30%**, rises with age, and never collapses.
Current calibration (`tauBase 0.36, beta 0.16`) lands ~19% overall (per-band ≈ 16/16/18/20/25%). The regression
lock `maxScores {17,18,17,14,11,23}` / `neutral {.53,.49,.55,.52,.58,.53}` guards against content drift. Rerun `pnpm test` after any change.

## Deploy — Cloudflare Pages

- **Build command:** `pnpm generate`
- **Build output directory:** `dist`
- **Node:** 18+ (built on 20)
- No environment variables required; **never** put secrets in the frontend. `VITE_USE_LLM`
  may toggle the (degrading) LLM provider. Future dynamic OG images / real LLM copy belong in
  Pages Functions, hidden behind the edge — not the static site.

`public/_redirects` sends `/` to the default locale and provides an SPA fallback.
Alternate hosts (Vercel/Netlify) work the same way from `dist`.

## Disclaimer

For entertainment and self-reflection, not scientific advice. Descriptions are aggregated
market consensus; the dimensions draw on psychology but equal no clinical scale.
