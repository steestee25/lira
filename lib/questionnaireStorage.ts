import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

const QUESTIONNAIRE_DRAFT_KEY = 'questionnaire_draft'
const QUESTIONNAIRE_PROFICIENCY_KEY = 'questionnaire_proficiency_level'
const ONBOARDING_STEP_KEY = 'questionnaire_onboarding_step'

export type QuestionnaireDraft = {
  answers: Record<string, string | string[] | null>
  index: number
}

export async function loadQuestionnaireDraft(): Promise<QuestionnaireDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(QUESTIONNAIRE_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as QuestionnaireDraft
  } catch (error) {
    console.error('Errore nel caricamento del draft questionario:', error)
    return null
  }
}

export async function saveQuestionnaireDraft(draft: QuestionnaireDraft): Promise<void> {
  try {
    await AsyncStorage.setItem(QUESTIONNAIRE_DRAFT_KEY, JSON.stringify(draft))
  } catch (error) {
    console.error('Errore nel salvataggio del draft questionario:', error)
  }
}

export async function clearQuestionnaireDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUESTIONNAIRE_DRAFT_KEY)
  } catch (error) {
    console.error('Errore nella cancellazione del draft questionario:', error)
  }
}

export async function saveOnboardingStep(step: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STEP_KEY, step)
  } catch (error) {
    console.error('Errore nel salvataggio dello step di onboarding:', error)
  }
}

export async function loadOnboardingStep(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_STEP_KEY)
    return value
  } catch (error) {
    console.error('Errore nel caricamento dello step di onboarding:', error)
    return null
  }
}

export async function clearOnboardingStep(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STEP_KEY)
  } catch (error) {
    console.error('Errore nella cancellazione dello step di onboarding:', error)
  }
}

export async function saveProficiencyLevel(level: string): Promise<void> {
  try {
    await AsyncStorage.setItem(QUESTIONNAIRE_PROFICIENCY_KEY, level)
  } catch (error) {
    console.error('Errore nel salvataggio del proficiency level:', error)
  }
}

export async function loadProficiencyLevel(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(QUESTIONNAIRE_PROFICIENCY_KEY)
    return value
  } catch (error) {
    console.error('Errore nel caricamento del proficiency level:', error)
    return null
  }
}

export async function clearProficiencyLevel(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUESTIONNAIRE_PROFICIENCY_KEY)
  } catch (error) {
    console.error('Errore nella cancellazione del proficiency level:', error)
  }
}

export async function loadProficiencyLevelWithFallback(): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('Impossibile ottenere user ID:', authError?.message)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('proficiency_level')
      .eq('id', user.id)
      .single()

    if (error) {
      console.warn('Errore nel caricamento del proficiency level da DB:', error.message)
      return null
    }

    if (data?.proficiency_level) {
      // Salva in cache dopo il fetch
      await saveProficiencyLevel(data.proficiency_level)
      console.log('✓ Proficiency level caricato da Supabase e cachato:', data.proficiency_level)
      return data.proficiency_level
    }

    return null
  } catch (err) {
    console.error('Errore inaspettato in loadProficiencyLevelWithFallback:', err)
    return null
  }
}
