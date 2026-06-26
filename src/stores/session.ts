// Test/match session state (design/02 §9). Holds answers; the vector is derived
// via the pure core. Result/match pages reproduce from the URL, not this store.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AnswerMap, PersonalityVector } from '~/core/types'
import { score } from '~/core/personality'
import { questionsForTier } from '~/data'

export const useSession = defineStore('session', () => {
  const sign = ref<string>('aries')
  const ageBand = ref<number>(2)
  const tier = ref<'quick' | 'full'>('full')
  const answers = ref<AnswerMap>({})
  const ideal = ref<PersonalityVector | null>(null)

  const tierQuestions = computed(() => questionsForTier(tier.value))
  const vector = computed<PersonalityVector>(() => score(tierQuestions.value, answers.value))
  const total = computed(() => tierQuestions.value.length)
  const answeredCount = computed(() => tierQuestions.value.filter((q) => answers.value[q.id] != null).length)
  const complete = computed(() => total.value > 0 && answeredCount.value === total.value)
  const hasResult = computed(() => answeredCount.value > 0)

  function answer(qid: string, oid: string) {
    answers.value = { ...answers.value, [qid]: oid }
  }
  function reset() {
    answers.value = {}
    ideal.value = null
  }

  return {
    sign, ageBand, tier, answers, ideal,
    tierQuestions, vector, total, answeredCount, complete, hasResult,
    answer, reset,
  }
})
