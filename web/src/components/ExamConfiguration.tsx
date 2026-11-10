import { EXAM_QUESTION_COUNT } from '../config'

interface ExamConfigurationProps {
  usableCount: number
  imageLinkedCount: number
  onStart: () => void
}

/** Kept for reuse; the home screen uses a simpler start panel. */
export function ExamConfiguration({ usableCount, onStart }: ExamConfigurationProps) {
  const canStart = usableCount >= EXAM_QUESTION_COUNT

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={!canStart}
      className="rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
    >
      Start exam
    </button>
  )
}
