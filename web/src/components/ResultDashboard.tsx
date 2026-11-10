import type { ExamAttempt } from '../types'

interface ResultDashboardProps {
  attempt: ExamAttempt
  onReview: () => void
  onRetake: () => void
  onHome: () => void
}

export function ResultDashboard({ attempt, onReview, onRetake, onHome }: ResultDashboardProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Exam finished</h1>
        <p className="mt-4 text-5xl font-bold text-slate-900">
          {attempt.score}
          <span className="text-2xl font-semibold text-slate-400">/100</span>
        </p>
        <p
          className={`mt-3 text-base font-semibold ${
            attempt.passed ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {attempt.passed ? 'Passed' : 'Not passed'}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Correct {attempt.correct} · Wrong {attempt.incorrect} · Skipped {attempt.unanswered}
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={onReview}
            className="rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
          >
            Review answers
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onHome}
            className="rounded-xl px-4 py-3 text-base font-medium text-slate-500 hover:text-slate-700"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
