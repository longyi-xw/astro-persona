// @nuxt/eslint generates the flat config from project conventions during `nuxt prepare`.
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // design/ holds the Claude Design prototype export (third-party runtime) — not our source.
  { ignores: ['design/**', 'dist/**', '.output/**', '.nuxt/**'] },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
