import { useState, useCallback, useMemo } from 'react'
import Header from './components/Header.jsx'
import FileDropzone from './components/FileDropzone.jsx'
import ConfigPanel from './components/ConfigPanel.jsx'
import QuestionBankEditor from './components/QuestionBankEditor.jsx'
import ExamView from './components/ExamView.jsx'
import ResultsView from './components/ResultsView.jsx'
import { ExamProvider } from './context/ExamContext.jsx'
import { useExam } from './hooks/useExam.js'

const VIEW = {
  UPLOAD: 'upload',
  CONFIG: 'config',
  REVIEW: 'review',
  EXAM: 'exam',
  RESULTS: 'results',
}

export default function App() {
  return (
    <ExamProvider>
      <Shell />
    </ExamProvider>
  )
}

function Shell() {
  const [view, setView] = useState(VIEW.UPLOAD)
  const { startRetryExam, startExam, loadQuestions, questions, excluded, config } = useExam()
  const excludedSet = useMemo(() => new Set(excluded), [excluded])

  const goToConfig = useCallback(() => setView(VIEW.CONFIG), [])
  const goToReview = useCallback(() => setView(VIEW.REVIEW), [])
  const goToExam = useCallback(() => setView(VIEW.EXAM), [])
  const goToResults = useCallback(() => setView(VIEW.RESULTS), [])
  const goToUpload = useCallback(() => {
    loadQuestions([])
    setView(VIEW.UPLOAD)
  }, [loadQuestions])

  const handleRetry = useCallback(() => {
    const session = startRetryExam()
    if (session) goToExam()
  }, [startRetryExam, goToExam])

  const handleStartFromReview = useCallback(() => {
    const active = questions.filter((q) => !excludedSet.has(q.id))
    if (active.length === 0) return
    const safeCount = Math.max(1, Math.min(active.length, config.questionCount || active.length))
    const session = startExam('normal', null, { questionCount: safeCount })
    if (session) goToExam()
  }, [startExam, goToExam, questions, excludedSet, config.questionCount])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {view === VIEW.UPLOAD && <FileDropzone onContinue={goToConfig} />}
        {view === VIEW.CONFIG && (
          <ConfigPanel onStart={goToExam} onReview={goToReview} onChangeFile={goToUpload} />
        )}
        {view === VIEW.REVIEW && (
          <QuestionBankEditor onBack={goToConfig} onStart={handleStartFromReview} />
        )}
        {view === VIEW.EXAM && <ExamView onFinish={goToResults} onCancel={goToConfig} />}
        {view === VIEW.RESULTS && (
          <ResultsView onRetry={handleRetry} onNew={goToConfig} onChangeFile={goToUpload} />
        )}
      </main>
    </div>
  )
}
