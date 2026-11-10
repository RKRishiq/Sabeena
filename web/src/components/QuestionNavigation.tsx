import { ChevronLeft, ChevronRight } from 'lucide-react'

interface QuestionNavigationProps {
  total: number
  currentIndex: number
  answers: Record<number, string>
  questionIds: number[]
  markedForReview: number[]
  onNavigate: (index: number) => void
  onToggleMark: () => void
}

export function QuestionNavigation({
  total,
  currentIndex,
  answers,
  questionIds,
  markedForReview,
  onNavigate,
  onToggleMark,
}: QuestionNavigationProps) {
  const currentId = questionIds[currentIndex]
  const isMarked = markedForReview.includes(currentId)

  return (
    <>
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
          <button
            type="button"
            onClick={onToggleMark}
            className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium ${
              isMarked
                ? 'bg-violet-100 text-violet-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isMarked ? 'Marked' : 'Mark'}
          </button>
        </div>

        <div className="max-h-44 overflow-y-auto overscroll-contain sm:max-h-none">
          <div className="grid grid-cols-5 gap-1.5 xs:grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 xl:grid-cols-10">
            {questionIds.map((id, index) => {
              const answered = Boolean(answers[id])
              const marked = markedForReview.includes(id)
              const current = index === currentIndex

              let styles = 'border-slate-200 bg-white text-slate-600'
              if (answered) styles = 'border-blue-200 bg-blue-50 text-blue-800'
              if (marked) styles = 'border-violet-300 bg-violet-50 text-violet-800'
              if (current) styles = 'border-blue-600 bg-blue-600 text-white'

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onNavigate(index)}
                  className={`min-h-10 rounded-md border text-xs font-semibold sm:h-9 ${styles}`}
                  aria-label={`Go to question ${index + 1}`}
                  aria-current={current ? 'true' : undefined}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop / tablet prev-next */}
        <div className="mt-4 hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={() => onNavigate(Math.min(total - 1, currentIndex + 1))}
            disabled={currentIndex >= total - 1}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      {/* Mobile sticky bottom controls */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <button
            type="button"
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={onToggleMark}
            className={`min-h-12 rounded-xl px-4 text-sm font-semibold ${
              isMarked ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isMarked ? 'Marked' : 'Mark'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate(Math.min(total - 1, currentIndex + 1))}
            disabled={currentIndex >= total - 1}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </>
  )
}
