import { PASS_PERCENTAGE } from '../config'
import type { ExamAttempt, ExamSession, Question } from '../types'

export interface ScoreBreakdown {
  score: number
  percentage: number
  correct: number
  incorrect: number
  unanswered: number
  passed: boolean
}

export function scoreExam(
  questionIds: number[],
  answers: Record<number, string>,
  questionMap: Map<number, Question>,
): ScoreBreakdown {
  let correct = 0
  let incorrect = 0
  let unanswered = 0

  for (const id of questionIds) {
    const selected = answers[id]
    const question = questionMap.get(id)
    if (!selected) {
      unanswered += 1
      continue
    }
    if (question && selected === question.correct_answer) {
      correct += 1
    } else {
      incorrect += 1
    }
  }

  const total = questionIds.length
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10

  return {
    score: correct,
    percentage,
    correct,
    incorrect,
    unanswered,
    passed: percentage >= PASS_PERCENTAGE,
  }
}

export function buildAttempt(
  session: ExamSession,
  questionMap: Map<number, Question>,
  submittedAt = Date.now(),
): ExamAttempt {
  const breakdown = scoreExam(session.questionIds, session.answers, questionMap)
  const elapsed = Math.max(0, submittedAt - session.startedAt)
  const timeTakenMs = Math.min(elapsed, session.durationMs)

  return {
    id: session.id,
    startedAt: session.startedAt,
    submittedAt,
    durationMs: session.durationMs,
    timeTakenMs,
    questionIds: session.questionIds,
    answers: { ...session.answers },
    ...breakdown,
  }
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function remainingMs(startedAt: number, durationMs: number, now = Date.now()): number {
  return Math.max(0, durationMs - (now - startedAt))
}
