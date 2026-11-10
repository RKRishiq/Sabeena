import { STORAGE_HISTORY_KEY } from '../config'
import type { ExamAttempt } from '../types'

export function loadHistory(): ExamAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed as ExamAttempt[]
  } catch {
    return []
  }
}

export function saveHistory(attempts: ExamAttempt[]): void {
  localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(attempts))
}

export function appendAttempt(attempt: ExamAttempt): ExamAttempt[] {
  const next = [attempt, ...loadHistory()]
  saveHistory(next)
  return next
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_HISTORY_KEY)
}

export function historyStats(attempts: ExamAttempt[]): {
  total: number
  average: number | null
  best: number | null
} {
  if (attempts.length === 0) {
    return { total: 0, average: null, best: null }
  }
  const scores = attempts.map((attempt) => attempt.score)
  const sum = scores.reduce((acc, value) => acc + value, 0)
  return {
    total: attempts.length,
    average: Math.round((sum / attempts.length) * 10) / 10,
    best: Math.max(...scores),
  }
}
