// Test/match session state (design/02 §9). Holds answers; the vector is derived
// via the pure core from injected content. Result/match pages reproduce from the
// URL, not this store.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnswerMap, PersonalityVector } from '~/core/types'
import { score } from '~/core/personality'
import { getMaxScores, getQuestionItems } from '~/content'

export const useSession = defineStore('session', () => {
  const sign = ref<string>('aries')
  const ageBand = ref<number>(2)
  const answers = ref<AnswerMap>({})
  const ideal = ref<PersonalityVector | null>(null)

  const items = getQuestionItems()
  const maxScores = getMaxScores()

  const total = computed(() => items.length)
  const vector = computed<PersonalityVector>(() => score(items, answers.value, maxScores))
  const answeredCount = computed(() => items.filter((q) => answers.value[q.id] != null).length)
  const complete = computed(() => total.value > 0 && answeredCount.value === total.value)
  const hasResult = computed(() => answeredCount.value > 0)

  function answer(qid: string, oid: string) {
    answers.value = { ...answers.value, [qid]: oid }
  }
  function reset() {
    answers.value = {}
    ideal.value = null
  }

  return { sign, ageBand, answers, ideal, items, total, vector, answeredCount, complete, hasResult, answer, reset }
})
