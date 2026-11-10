import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnswerReview } from './components/AnswerReview'
import { Dashboard } from './components/Dashboard'
import { ExamHeader } from './components/ExamHeader'
import { QuestionCard } from './components/QuestionCard'
import { QuestionNavigation } from './components/QuestionNavigation'
import { ResultDashboard } from './components/ResultDashboard'
import { SubmitConfirmation } from './components/SubmitConfirmation'
import {
  EXAM_DURATION_MS,
  EXAM_QUESTION_COUNT,
  TIMER_WARNING_MS,
} from './config'
import {
  countImageLinkedQuestions,
  getUsableQuestions,
  indexQuestions,
  loadQuestions,
  selectExamQuestions,
} from './lib/questions'
import { buildAttempt, remainingMs } from './lib/scoring'
import {
  appendAttempt,
  clearHistory,
  historyStats,
  loadHistory,
} from './lib/storage'
import type {
  AppView,
  ExamAttempt,
  ExamSession,
  Question,
  ReviewFilter,
} from './types'

function createSession(questions: Question[]): ExamSession {
  const selected = selectExamQuestions(questions)
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    durationMs: EXAM_DURATION_MS,
    questionIds: selected.map((question) => question.id),
    answers: {},
    markedForReview: [],
    currentIndex: 0,
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('dashboard')
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<ExamAttempt[]>(() => loadHistory())
  const [session, setSession] = useState<ExamSession | null>(null)
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const questions = await loadQuestions()
        if (!cancelled) {
          setAllQuestions(questions)
          setLoadError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load the extracted question bank.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const usableQuestions = useMemo(
    () => getUsableQuestions(allQuestions),
    [allQuestions],
  )
  const questionMap = useMemo(() => indexQuestions(allQuestions), [allQuestions])
  const imageLinkedCount = useMemo(
    () => countImageLinkedQuestions(usableQuestions),
    [usableQuestions],
  )
  const stats = useMemo(() => historyStats(history), [history])

  const remaining = session
    ? remainingMs(session.startedAt, session.durationMs, now)
    : 0
  const warning = Boolean(session && remaining <= TIMER_WARNING_MS && remaining > 0)

  const answeredCount = session
    ? session.questionIds.filter((id) => Boolean(session.answers[id])).length
    : 0
  const unansweredCount = session ? session.questionIds.length - answeredCount : 0

  const submitExam = useCallback(
    (currentSession: ExamSession, submittedAt = Date.now()) => {
      const attempt = buildAttempt(currentSession, questionMap, submittedAt)
      setActiveAttempt(attempt)
      setHistory(appendAttempt(attempt))
      setSession(null)
      setShowSubmitConfirm(false)
      setReviewFilter('all')
      setView('result')
    },
    [questionMap],
  )

  useEffect(() => {
    if (view !== 'exam' || !session) {
      return
    }
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [view, session])

  useEffect(() => {
    if (view !== 'exam' || !session) {
      return
    }
    if (remainingMs(session.startedAt, session.durationMs, now) <= 0) {
      submitExam(session, session.startedAt + session.durationMs)
    }
  }, [now, session, submitExam, view])

  const startExam = () => {
    if (usableQuestions.length < EXAM_QUESTION_COUNT) {
      return
    }
    const next = createSession(usableQuestions)
    const uniqueIds = new Set(next.questionIds)
    if (uniqueIds.size !== EXAM_QUESTION_COUNT) {
      setLoadError('Exam generation produced duplicate questions. Please try again.')
      return
    }
    setSession(next)
    setActiveAttempt(null)
    setShowSubmitConfirm(false)
    setNow(Date.now())
    setView('exam')
  }

  const selectAnswer = (optionId: string) => {
    if (!session) return
    const questionId = session.questionIds[session.currentIndex]
    setSession({
      ...session,
      answers: {
        ...session.answers,
        [questionId]: optionId,
      },
    })
  }

  const navigate = (index: number) => {
    if (!session) return
    setSession({
      ...session,
      currentIndex: Math.max(0, Math.min(session.questionIds.length - 1, index)),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleMark = () => {
    if (!session) return
    const questionId = session.questionIds[session.currentIndex]
    const marked = session.markedForReview.includes(questionId)
      ? session.markedForReview.filter((id) => id !== questionId)
      : [...session.markedForReview, questionId]
    setSession({ ...session, markedForReview: marked })
  }

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'Clear all examination history stored in this browser?',
    )
    if (!confirmed) return
    clearHistory()
    setHistory([])
  }

  const openHistoryReview = (attempt: ExamAttempt) => {
    setActiveAttempt(attempt)
    setReviewFilter('all')
    setView('review')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading question bank…
      </div>
    )
  }

  if (view === 'exam' && session) {
    const currentId = session.questionIds[session.currentIndex]
    const currentQuestion = questionMap.get(currentId)

    if (!currentQuestion) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-rose-700">
            The current examination question could not be found in the loaded bank.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={() => {
              setSession(null)
              setView('dashboard')
            }}
          >
            Return to dashboard
          </button>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-slate-50">
        <ExamHeader
          remainingMs={remaining}
          warning={warning}
          totalQuestions={session.questionIds.length}
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          onSubmit={() => setShowSubmitConfirm(true)}
        />
        <main className="mx-auto grid max-w-6xl gap-4 px-3 pb-6 pt-4 sm:px-4 sm:py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <QuestionCard
            question={currentQuestion}
            examIndex={session.currentIndex}
            totalQuestions={session.questionIds.length}
            selectedAnswer={session.answers[currentId]}
            onSelect={selectAnswer}
            markedForReview={session.markedForReview.includes(currentId)}
            nav={{
              canPrev: session.currentIndex > 0,
              canNext: session.currentIndex < session.questionIds.length - 1,
              isMarked: session.markedForReview.includes(currentId),
              onPrev: () => navigate(session.currentIndex - 1),
              onNext: () => navigate(session.currentIndex + 1),
              onMark: toggleMark,
            }}
          />
          <QuestionNavigation
            total={session.questionIds.length}
            currentIndex={session.currentIndex}
            answers={session.answers}
            questionIds={session.questionIds}
            markedForReview={session.markedForReview}
            onNavigate={navigate}
            onToggleMark={toggleMark}
          />
        </main>
        {showSubmitConfirm ? (
          <SubmitConfirmation
            unansweredCount={unansweredCount}
            answeredCount={answeredCount}
            totalQuestions={session.questionIds.length}
            onCancel={() => setShowSubmitConfirm(false)}
            onConfirm={() => submitExam(session)}
          />
        ) : null}
      </div>
    )
  }

  if (view === 'result' && activeAttempt) {
    return (
      <ResultDashboard
        attempt={activeAttempt}
        onReview={() => {
          setReviewFilter('all')
          setView('review')
        }}
        onRetake={startExam}
        onHome={() => setView('dashboard')}
      />
    )
  }

  if (view === 'review' && activeAttempt) {
    return (
      <AnswerReview
        attempt={activeAttempt}
        questionMap={questionMap}
        filter={reviewFilter}
        onFilterChange={setReviewFilter}
        onBack={() => setView('result')}
      />
    )
  }

  return (
    <Dashboard
      usableCount={usableQuestions.length}
      imageLinkedCount={imageLinkedCount}
      totalInBank={allQuestions.length}
      attempts={history}
      average={stats.average}
      best={stats.best}
      onStart={startExam}
      onReviewAttempt={openHistoryReview}
      onClearHistory={handleClearHistory}
      loadError={loadError}
    />
  )
}
