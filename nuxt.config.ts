// https://nuxt.com/docs/api/configuration/nuxt-config
const fontsHref =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600' +
  '&family=Noto+Serif+SC:wght@500;600;700&family=Inter:wght@400;500;600&family=Noto+Sans+SC:wght@400;500' +
  '&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Symbols+2&display=swap'

export default defineNuxtConfig({
  srcDir: 'src/',
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  ssr: true,

  modules: ['@nuxtjs/i18n', '@pinia/nuxt', '@unocss/nuxt', '@nuxt/eslint'],

  css: ['~/assets/css/tokens.css'],

  typescript: {
    strict: true,
    // typecheck runs as a separate script (pnpm typecheck) to keep dev fast
    typeCheck: false,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: fontsHref },
      ],
    },
  },

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'zh',
    locales: [
      { code: 'zh', language: 'zh-CN', name: '中文', dir: 'ltr' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'ap_lang',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
    vueI18n: './i18n.config.ts',
    baseUrl: 'https://astropersona.app',
  },

  // Static-first: content & landing prerendered; test/result/match hydrate as
  // CSR shells that read the URL. Seed both locale roots so the crawler can
  // discover the signs list + 12 detail pages (/* is a redirect under `prefix`).
  nitro: {
    // Force a pure static build even inside Cloudflare's build env, which
    // otherwise auto-selects the `cloudflare-module` server preset. That preset
    // + `nuxt generate` emits no worker entry (index.mjs) and overrides our
    // wrangler config, breaking `wrangler deploy`. We ship the prerendered
    // output as an assets-only Worker via wrangler.jsonc instead.
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/zh', '/en', '/zh/signs', '/en/signs'],
    },
  },

  runtimeConfig: {
    public: {
      // VITE_USE_LLM toggles the narrative provider; never put secrets here.
      useLlm: false,
      siteUrl: 'https://astropersona.app',
    },
  },
})
