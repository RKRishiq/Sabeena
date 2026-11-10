import { Clock } from 'lucide-react'
import { formatDuration } from '../lib/scoring'

interface ExamTimerProps {
  remainingMs: number
  warning: boolean
}

export function ExamTimer({ remainingMs, warning }: ExamTimerProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${
        warning
          ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
          : 'bg-slate-100 text-slate-800'
      }`}
      aria-live="polite"
    >
      <Clock className="h-4 w-4" aria-hidden />
      <span>{formatDuration(remainingMs)}</span>
    </div>
  )
}
