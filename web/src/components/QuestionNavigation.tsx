import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
  currentIndex,
  answers,
  questionIds,
  markedForReview,
  onNavigate,
}: QuestionNavigationProps) {
  const [open, setOpen] = useState(false)
  const answeredCount = questionIds.filter((id) => Boolean(answers[id])).length

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      {/* Mobile: collapsed by default so Next under answers is enough */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-900">Jump to question</p>
          <p className="text-xs text-slate-500">
            {answeredCount}/{questionIds.length} answered
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <div className="mb-3 hidden items-center justify-between gap-2 lg:flex">
        <h3 className="text-sm font-semibold text-slate-900">Questions</h3>
        <p className="text-xs text-slate-500">
          {answeredCount}/{questionIds.length} answered
        </p>
      </div>

      <div className={`${open ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
        <div className="max-h-52 overflow-y-auto overscroll-contain lg:max-h-none">
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 lg:grid-cols-5 xl:grid-cols-10">
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
                  onClick={() => {
                    onNavigate(index)
                    setOpen(false)
                  }}
                  className={`min-h-10 rounded-md border text-xs font-semibold ${styles}`}
                  aria-label={`Go to question ${index + 1}`}
                  aria-current={current ? 'true' : undefined}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
