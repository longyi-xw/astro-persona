// 客户端把离屏卡片转 PNG（无后端）。Web Share API 优先（移动端），桌面退化为下载。
import { ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'

export function useShareCard(filenameBase: string) {
  const cardRef = ref<ComponentPublicInstance | null>(null)
  const saving = ref(false)

  async function render(): Promise<string | null> {
    const el = (cardRef.value?.$el ?? null) as HTMLElement | null
    if (!el || !import.meta.client) return null
    const { domToPng } = await import('modern-screenshot')
    return domToPng(el, { scale: 2, backgroundColor: '#0E1530' })
  }

  async function saveImage() {
    if (saving.value) return
    saving.value = true
    try {
      const dataUrl = await render()
      if (!dataUrl) return
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `${filenameBase}.png`, { type: 'image/png' })

      // Web Share API first (mobile native sheet), else download.
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: 'Astro Persona' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${filenameBase}.png`
        a.click()
      }
    } catch (err) {
      console.error('share card export failed', err)
    } finally {
      saving.value = false
    }
  }

  return { cardRef, saving, saveImage, render }
}
