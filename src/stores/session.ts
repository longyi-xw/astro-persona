// Test/match session state (design/02 §9). Holds answers; the vector is derived
// via the pure core from injected content. Result/match pages reproduce from the
// URL, not this store.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnswerMap, PersonalityVector } from '~/core/types'
import { score } from '~/core/personality'
import { getQuestionItems, maxScoresFor } from '~/content'

/** 快测取前 N 题（仍覆盖六维）；完整为全部题。 */
const QUICK_COUNT = 12

export const useSession = defineStore('session', () => {
  const sign = ref<string>('aries')
  const ageBand = ref<number>(2)
  const tier = ref<'quick' | 'full'>('full')
  const answers = ref<AnswerMap>({})
  const ideal = ref<PersonalityVector | null>(null)

  const allItems = getQuestionItems()
  const items = computed(() => (tier.value === 'quick' ? allItems.slice(0, QUICK_COUNT) : allItems))
  const maxScores = computed(() => maxScoresFor(items.value))

  const total = computed(() => items.value.length)
  const vector = computed<PersonalityVector>(() => score(items.value, answers.value, maxScores.value))
  const answeredCount = computed(() => items.value.filter((q) => answers.value[q.id] != null).length)
  const complete = computed(() => total.value > 0 && answeredCount.value === total.value)
  const hasResult = computed(() => answeredCount.value > 0)

  function answer(qid: string, oid: string) {
    answers.value = { ...answers.value, [qid]: oid }
  }
  function reset() {
    answers.value = {}
    ideal.value = null
  }

  return { sign, ageBand, tier, answers, ideal, items, total, vector, answeredCount, complete, hasResult, answer, reset }
})
