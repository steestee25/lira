export type ProficiencyLevel = 'base' | 'intermediate' | 'advanced'

export type FinancialScoreResult = {
  selfScore: number
  quizScore: number
  totalScore: number
  proficiencyLevel: ProficiencyLevel
}

const selfAssessmentMap: Record<string, number> = {
  very_low: 0,
  low: 1,
  average: 2,
  good: 3,
  very_good: 4,
}

const readingMap: Record<string, number> = {
  never: 0,
  sometimes: 1,
  often: 2,
}

const quizCorrectAnswers: Record<string, string> = {
  quiz1: 'same',
  quiz2: 'etf_fund',
  quiz3: '1630',
  quiz4: 'lose_real_value',
  quiz5: 'high_correlation',
}

function getSelfAssessmentScore(value: string | null): number {
  if (!value) return 0
  return selfAssessmentMap[value] ?? 0
}

function getReadingScore(value: string | null): number {
  if (!value) return 0
  return readingMap[value] ?? 0
}

function getQuizScore(answers: Record<string, string | string[] | null>): number {
  return Object.entries(quizCorrectAnswers).reduce((score, [key, correctAnswer]) => {
    const answer = answers[key]
    if (typeof answer !== 'string') return score
    return answer === correctAnswer ? score + 1 : score
  }, 0)
}

function getProficiencyLevel(totalScore: number, quizScore: number): ProficiencyLevel {
  if (quizScore <= 2 || totalScore <= 5) {
    return 'base'
  }

  if (totalScore <= 8) {
    return 'intermediate'
  }

  return 'advanced'
}

export function computeFinancialScore(
  answers: Record<string, string | string[] | null>
): FinancialScoreResult {
  const selfScore = getSelfAssessmentScore(answers.selfEval as string | null)
  const readingScore = getReadingScore(answers.reading as string | null)
  const quizScore = getQuizScore(answers)
  const totalScore = selfScore + readingScore + quizScore
  const proficiencyLevel = getProficiencyLevel(totalScore, quizScore)

  return {
    selfScore: selfScore + readingScore,
    quizScore,
    totalScore,
    proficiencyLevel,
  }
}
