import { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { clearOnboardingStep, clearProficiencyLevel, clearQuestionnaireDraft, loadOnboardingStep, loadProficiencyLevel, loadQuestionnaireDraft, saveProficiencyLevel } from '../lib/questionnaireStorage'
import { supabase } from '../lib/supabase'

type AuthStep = 'initial' | 'email' | 'password' | 'name' | 'questionnaire'

type AuthContextType = {
  session: Session | null
  loading: boolean
  isOnboarding: boolean
  isCelebrating: boolean
  authStep: AuthStep
  beginOnboarding: () => void
  finishOnboarding: () => void
  startCelebration: () => void
  endCelebration: () => void
  setAuthStep: (step: AuthStep) => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isOnboarding: false,
  isCelebrating: false,
  authStep: 'initial',
  beginOnboarding: () => {},
  finishOnboarding: () => {},
  startCelebration: () => {},
  endCelebration: () => {},
  setAuthStep: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('initial')

  useEffect(() => {
    const restoreProfileState = async (userId: string) => {
      try {
        const draft = await loadQuestionnaireDraft()
        if (draft) {
          setIsOnboarding(true)
          setAuthStep('questionnaire')
          return
        }

        const localStep = await loadOnboardingStep()
        if (localStep) {
          setIsOnboarding(true)
          setAuthStep(localStep as any)
          return
        }

        const localProficiency = await loadProficiencyLevel()
        if (localProficiency) {
          setIsOnboarding(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('financial_score, proficiency_level')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error('Errore nel controllo profilo:', error)
          setIsOnboarding(true)
          setAuthStep('questionnaire')
          return
        }

        const hasCompleted = !!data && data.financial_score !== null && data.proficiency_level !== null

        if (hasCompleted) {
          setIsOnboarding(false)
          await saveProficiencyLevel(data.proficiency_level)
          await clearQuestionnaireDraft()
        } else {
          setIsOnboarding(true)
          setAuthStep('questionnaire')
        }
      } catch (error) {
        console.error('Errore nel controllo profilo:', error)
        setIsOnboarding(true)
        setAuthStep('questionnaire')
      }
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)

        if (session) {
          await restoreProfileState(session.user.id)
        }
      } finally {
        setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (!session) {
        setIsOnboarding(false)
        setIsCelebrating(false)
        setAuthStep('initial')
        // Pulisci TUTTI i dati di onboarding quando l'utente fa logout
        await clearOnboardingStep()
        await clearQuestionnaireDraft()
        await clearProficiencyLevel()
        return
      }

      await restoreProfileState(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    // Allows all children components to access AuthContext values
    // So anyone using useAuth() can access these values and call these functions
    <AuthContext.Provider
      value={{
        session,
        loading,
        isOnboarding,
        isCelebrating,
        authStep,
        beginOnboarding: () => setIsOnboarding(true),
        finishOnboarding: () => {
          setIsOnboarding(false)
          setAuthStep('initial')
        },
        startCelebration: () => {
          setIsOnboarding(false)
          setAuthStep('initial')
          setIsCelebrating(true)
        },
        endCelebration: () => {
          setIsCelebrating(false)
        },
        setAuthStep,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Allow other components to use the AuthContext values using useAuth() hook
// Hiding the useContext(AuthContext) implementation details
// Instead of: const { session, loading } = useContext(AuthContext)
// Use: const { session, loading } = useAuth()
export const useAuth = () => useContext(AuthContext)
