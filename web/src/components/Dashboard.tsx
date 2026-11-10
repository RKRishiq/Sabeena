import { EXAM_DURATION_MS, EXAM_QUESTION_COUNT } from '../config'
import { formatDuration } from '../lib/scoring'
import type { ExamAttempt } from '../types'
import { ExamHistory } from './ExamHistory'

interface DashboardProps {
  usableCount: number
  imageLinkedCount: number
  totalInBank: number
  attempts: ExamAttempt[]
  average: number | null
  best: number | null
  onStart: () => void
  onReviewAttempt: (attempt: ExamAttempt) => void
  onClearHistory: () => void
  loadError: string | null
}

export function Dashboard({
  usableCount,
  attempts,
  best,
  onStart,
  onReviewAttempt,
  onClearHistory,
  loadError,
}: DashboardProps) {
  const canStart = usableCount >= EXAM_QUESTION_COUNT

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-base text-blue-700">Assalam Alaikum</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Hi Sabeena Love</h1>
        <p className="mt-3 text-lg text-slate-600">Can we start the exam?</p>

        <p className="mt-6 text-sm text-slate-500">
          {EXAM_QUESTION_COUNT} questions · {formatDuration(EXAM_DURATION_MS)}
        </p>

        {loadError ? (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>
        ) : null}

        {!canStart ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Not enough questions to start yet.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          Yes, let&apos;s begin
        </button>

        {attempts.length > 0 ? (
          <p className="mt-4 text-center text-sm text-slate-500">
            Attempts: {attempts.length}
            {best !== null ? ` · Best: ${best}/100` : ''}
          </p>
        ) : null}
      </section>

      {attempts.length > 0 ? (
        <div className="mt-6">
          <ExamHistory
            attempts={attempts}
            onReview={onReviewAttempt}
            onClear={onClearHistory}
          />
        </div>
      ) : null}
    </div>
  )
}
