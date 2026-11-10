export type QuestionType =
  | 'TRUE_FALSE'
  | 'MULTIPLE_CHOICE'
  | 'IMAGE_BASED_TRUE_FALSE'
  | 'IMAGE_BASED_MULTIPLE_CHOICE'

export interface QuestionOption {
  id: string
  text: string
}

export interface Question {
  id: number
  question_number: number
  type: QuestionType
  question: string
  options: QuestionOption[]
  correct_answer: string | null
  images: string[]
  source_page: number
  validation_status: string
  explanation?: string
}

export type AppView = 'dashboard' | 'exam' | 'result' | 'review'

export interface ExamSession {
  id: string
  startedAt: number
  durationMs: number
  questionIds: number[]
  answers: Record<number, string>
  markedForReview: number[]
  currentIndex: number
}

export interface ExamAttempt {
  id: string
  startedAt: number
  submittedAt: number
  durationMs: number
  timeTakenMs: number
  questionIds: number[]
  answers: Record<number, string>
  score: number
  percentage: number
  correct: number
  incorrect: number
  unanswered: number
  passed: boolean
}

export type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered'
