import { ArrowLeft } from 'lucide-react'
import type { ExamAttempt, Question, ReviewFilter } from '../types'
import { QuestionCard } from './QuestionCard'

interface AnswerReviewProps {
  attempt: ExamAttempt
  questionMap: Map<number, Question>
  filter: ReviewFilter
  onFilterChange: (filter: ReviewFilter) => void
  onBack: () => void
}

function matchesFilter(
  attempt: ExamAttempt,
  question: Question,
  filter: ReviewFilter,
): boolean {
  const selected = attempt.answers[question.id]
  const isCorrect = Boolean(selected && selected === question.correct_answer)
  const isUnanswered = !selected

  if (filter === 'all') return true
  if (filter === 'correct') return isCorrect
  if (filter === 'incorrect') return Boolean(selected) && !isCorrect
  if (filter === 'unanswered') return isUnanswered
  return true
}

export function AnswerReview({
  attempt,
  questionMap,
  filter,
  onFilterChange,
  onBack,
}: AnswerReviewProps) {
  const questions = attempt.questionIds
    .map((id) => questionMap.get(id))
    .filter((question): question is Question => Boolean(question))
    .filter((question) => matchesFilter(attempt, question, filter))

  const filters: { id: ReviewFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'correct', label: 'Correct' },
    { id: 'incorrect', label: 'Incorrect' },
    { id: 'unanswered', label: 'Unanswered' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to result
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Review</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`min-h-10 rounded-full px-3 py-2 text-sm font-semibold transition ${
                filter === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No questions match this filter.
        </p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => {
            const examIndex = attempt.questionIds.indexOf(question.id)
            const selected = attempt.answers[question.id]
            const isCorrect = selected === question.correct_answer
            return (
              <div key={question.id} className="space-y-2">
                <div
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    !selected
                      ? 'bg-slate-100 text-slate-700'
                      : isCorrect
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {!selected ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'}
                </div>
                <QuestionCard
                  question={question}
                  examIndex={examIndex}
                  totalQuestions={attempt.questionIds.length}
                  selectedAnswer={selected}
                  onSelect={() => undefined}
                  showCorrectAnswer
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
