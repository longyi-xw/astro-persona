<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const nav = computed(() => [
  { to: localePath('/signs'), label: t('nav.signs') },
  { to: localePath('/test'), label: t('nav.test') },
  { to: localePath('/match'), label: t('nav.match') },
])
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="flex items-center justify-between px-5 sm:px-9 py-4 border-b border-[rgba(201,162,75,0.12)]">
      <NuxtLink :to="localePath('/')" class="flex items-baseline gap-3">
        <span class="font-serif-latin font-700 text-[20px] tracking-wide text-gold">Astro&nbsp;Persona</span>
        <span class="font-serif-sc text-[14px] text-[#cdbf9e] hidden sm:inline">{{ t('brandZh') }}</span>
      </NuxtLink>

      <nav class="flex items-center gap-5 text-[13px] text-muted">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="hover:text-bone transition-colors hidden sm:inline">
          {{ item.label }}
        </NuxtLink>
        <div class="flex items-center gap-1.5 font-mono text-[12px]">
          <NuxtLink
            :to="switchLocalePath('zh')"
            class="px-2.5 py-1 rounded-full transition-colors"
            :class="locale === 'zh' ? 'bg-gold text-ink font-600' : 'text-[#8b95c4] hover:text-bone'"
          >中</NuxtLink>
          <NuxtLink
            :to="switchLocalePath('en')"
            class="px-2.5 py-1 rounded-full transition-colors"
            :class="locale === 'en' ? 'bg-gold text-ink font-600' : 'text-[#8b95c4] hover:text-bone'"
          >EN</NuxtLink>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="px-5 sm:px-9 py-6 text-[12px] text-faint border-t border-[rgba(201,162,75,0.1)]">
      {{ t('common.disclaimer') }} · For entertainment and self-reflection, not scientific advice.
    </footer>
  </div>
</template>
