import { createContext, useContext } from 'react'

export const ExamContext = createContext(null)

export function useExam() {
  const ctx = useContext(ExamContext)
  if (!ctx) throw new Error('useExam debe usarse dentro de <ExamProvider>')
  return ctx
}
