import { ExamTimer } from './ExamTimer'

interface ExamHeaderProps {
  remainingMs: number
  warning: boolean
  totalQuestions: number
  answeredCount: number
  unansweredCount: number
  onSubmit: () => void
}

export function ExamHeader({
  remainingMs,
  warning,
  answeredCount,
  unansweredCount,
  onSubmit,
}: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Exam</p>
          <p className="text-xs text-slate-500">
            Done {answeredCount} · Left {unansweredCount}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ExamTimer remainingMs={remainingMs} warning={warning} />
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:px-4"
          >
            Submit
          </button>
        </div>
      </div>
      {warning ? (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          10 minutes left
        </div>
      ) : null}
    </header>
  )
}
