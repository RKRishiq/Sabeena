import { useState } from 'react'
import { Expand, ImageOff, X } from 'lucide-react'
import { assetUrl } from '../lib/assets'
import type { Question } from '../types'

interface QuestionCardProps {
  question: Question
  examIndex: number
  totalQuestions: number
  selectedAnswer: string | undefined
  onSelect: (optionId: string) => void
  showCorrectAnswer?: boolean
  markedForReview?: boolean
}

function QuestionImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const url = assetUrl(src)

  if (failed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm text-slate-500">
        <ImageOff className="h-4 w-4" aria-hidden />
        Image could not be loaded
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-2 text-left"
      >
        <img
          src={url}
          alt={alt}
          className="mx-auto max-h-64 w-auto max-w-full object-contain"
          onError={() => setFailed(true)}
        />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-slate-900/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          <Expand className="h-3 w-3" aria-hidden />
          Enlarge
        </span>
      </button>
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-slate-700 shadow"
            onClick={() => setLightbox(false)}
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={url}
            alt={alt}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}

export function QuestionCard({
  question,
  examIndex,
  totalQuestions,
  selectedAnswer,
  onSelect,
  showCorrectAnswer = false,
  markedForReview = false,
}: QuestionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="mb-3 text-sm font-medium text-slate-500">
        Question {examIndex + 1} of {totalQuestions}
        {markedForReview ? ' · Marked' : ''}
      </p>

      <h2 className="text-lg font-medium leading-relaxed text-slate-900 sm:text-xl">
        {question.question}
      </h2>

      {question.images?.length ? (
        <div className="mt-4 flex flex-col gap-3">
          {question.images.map((image, index) => (
            <QuestionImage
              key={`${question.id}-${image}-${index}`}
              src={image}
              alt={`Illustration for question ${question.question_number}`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id
          const isCorrect = showCorrectAnswer && option.id === question.correct_answer
          const isWrongSelection =
            showCorrectAnswer && isSelected && option.id !== question.correct_answer

          let styles =
            'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
          if (isSelected && !showCorrectAnswer) {
            styles = 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
          }
          if (isCorrect) {
            styles = 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
          }
          if (isWrongSelection) {
            styles = 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
          }

          const showLetterBadge = /^[A-D]$/.test(option.id)

          return (
            <button
              key={option.id}
              type="button"
              disabled={showCorrectAnswer}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${styles}`}
            >
              {showLetterBadge ? (
                <>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {option.id}
                  </span>
                  <span className="text-sm text-slate-800 sm:text-base">{option.text}</span>
                </>
              ) : (
                <span className="text-base font-medium text-slate-800">{option.text}</span>
              )}
            </button>
          )
        })}
      </div>

      {showCorrectAnswer ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          You: <span className="font-semibold">{selectedAnswer ?? 'Skipped'}</span>
          {' · '}
          Correct: <span className="font-semibold">{question.correct_answer}</span>
          {question.explanation ? (
            <p className="mt-2 text-slate-600">{question.explanation}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
