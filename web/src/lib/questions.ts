import { EXAM_QUESTION_COUNT, QUESTIONS_JSON_PATH } from '../config'
import type { Question } from '../types'
import { assetUrl } from './assets'

export function isUsableQuestion(question: Question): boolean {
  if (!question.question?.trim()) {
    return false
  }
  if (!Array.isArray(question.options) || question.options.length < 2) {
    return false
  }
  if (!question.correct_answer) {
    return false
  }
  return question.options.some((option) => option.id === question.correct_answer)
}

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch(assetUrl(QUESTIONS_JSON_PATH))
  if (!response.ok) {
    throw new Error(`Failed to load question bank (${response.status})`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Question bank is not a JSON array')
  }

  return data as Question[]
}

export function getUsableQuestions(questions: Question[]): Question[] {
  return questions.filter(isUsableQuestion)
}

export function countImageLinkedQuestions(questions: Question[]): number {
  return questions.filter((question) => question.images?.length > 0).length
}

/** Fisher-Yates shuffle returning a new array. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function selectExamQuestions(usable: Question[]): Question[] {
  if (usable.length < EXAM_QUESTION_COUNT) {
    throw new Error(
      `Need at least ${EXAM_QUESTION_COUNT} usable questions, found ${usable.length}`,
    )
  }
  return shuffle(usable).slice(0, EXAM_QUESTION_COUNT)
}

export function indexQuestions(questions: Question[]): Map<number, Question> {
  return new Map(questions.map((question) => [question.id, question]))
}
