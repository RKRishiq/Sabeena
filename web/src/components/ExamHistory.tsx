import type { ExamAttempt } from '../types'

interface ExamHistoryProps {
  attempts: ExamAttempt[]
  onReview: (attempt: ExamAttempt) => void
  onClear: () => void
}

export function ExamHistory({ attempts, onReview, onClear }: ExamHistoryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Past exams</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-rose-600 hover:text-rose-700"
        >
          Clear
        </button>
      </div>

      <ul className="space-y-2">
        {attempts.map((attempt) => (
          <li
            key={attempt.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {attempt.score}/100
              </p>
              <p className="text-xs text-slate-500">
                {new Date(attempt.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onReview(attempt)}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-slate-200 hover:bg-blue-50"
            >
              Review
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
