import zh from './src/locales/zh'
import en from './src/locales/en'

// UI chrome strings only. Domain copy (archetype names, keywords, mutation &
// match narration) lives in content/copy and is produced by src/narrative.
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: { zh, en },
}))
