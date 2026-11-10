interface SubmitConfirmationProps {
  unansweredCount: number
  answeredCount: number
  totalQuestions: number
  onConfirm: () => void
  onCancel: () => void
}

export function SubmitConfirmation({
  unansweredCount,
  onConfirm,
  onCancel,
}: SubmitConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="submit-title" className="text-lg font-semibold text-slate-900">
          Submit exam?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {unansweredCount > 0
            ? `${unansweredCount} questions are still unanswered.`
            : 'All questions are answered.'}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
