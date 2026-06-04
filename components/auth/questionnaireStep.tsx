import { COLORS } from '@/constants/color'
import { onboardingQuestions, Question } from '@/constants/questionnaire'
import { useTranslation } from '@/lib/i18n'
import { clearQuestionnaireDraft, loadQuestionnaireDraft, saveQuestionnaireDraft } from '@/lib/questionnaireStorage'
import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface Props {
  onBack: () => void
  onComplete: (answers: Record<string, string | string[] | null>) => void
}

export type QuestionnaireStepHandle = {
  goBack: () => void
}

const QuestionnaireStep = forwardRef<QuestionnaireStepHandle, Props>(function QuestionnaireStep(
  { onBack, onComplete },
  ref
) {
  const { t } = useTranslation()
  const [questions, setQuestions] = useState<Question[]>(onboardingQuestions)
  const [index, setIndex] = useState(0)

  const contentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const restoreDraft = async () => {
      const draft = await loadQuestionnaireDraft()
      if (!draft) {
        await saveDraft(0, onboardingQuestions)
        return
      }

      const restoredQuestions = onboardingQuestions.map((question) => ({
        ...question,
        answer: draft.answers[question.key] ?? question.answer ?? null,
      }))

      setQuestions(restoredQuestions)
      setIndex(Math.min(draft.index, restoredQuestions.length - 1))
    }

    restoreDraft()
  }, [])

  const getAnswersPayload = (questionList: Question[]) => {
    const payload: Record<string, string | string[] | null> = {}
    questionList.forEach((question) => {
      payload[question.key] = question.answer
    })
    return payload
  }

  const saveDraft = async (draftIndex: number, questionList: Question[]) => {
    await saveQuestionnaireDraft({ answers: getAnswersPayload(questionList), index: draftIndex })
  }

  const current = questions[index]
  const total = questions.length

  // Animation slide-in
  const slideIn = () => {
    contentAnim.setValue(40)
    Animated.timing(contentAnim, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  useEffect(() => {
    slideIn()
  }, [index])

  // --- Handle selection (single or multiple) ---
  const handleSelect = async (value: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const updated = [...questions]
    const q = updated[index]

    if (q.multiple) {
      const currentArray = Array.isArray(q.answer) ? q.answer : []

      if (currentArray.includes(value)) {
        q.answer = currentArray.filter((v) => v !== value)
      } else {
        q.answer = [...currentArray, value]
      }
    } else {
      q.answer = value
    }

    setQuestions(updated)
    await saveDraft(index, updated)
  }

  const handleNext = async () => {
    const answered = current.multiple
      ? Array.isArray(current.answer) && current.answer.length > 0
      : !!current.answer

    if (!answered) return

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (index < total - 1) {
      const nextIndex = index + 1
      setIndex(nextIndex)
      await saveDraft(nextIndex, questions)
    } else {
      const payload = getAnswersPayload(questions)
      await clearQuestionnaireDraft()
      onComplete(payload)
    }
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (index === 0) return onBack()

    const previousIndex = index - 1
    setIndex(previousIndex)
    await saveDraft(previousIndex, questions)
  }

  useImperativeHandle(ref, () => ({
    goBack: handleBack,
  }))

  const progress = (index + 1) / total

  const Option = ({
    label,
    selected,
    onPress,
  }: {
    label: string
    selected: boolean
    onPress: () => void
  }) => (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

  const isAnswered = current.multiple
    ? Array.isArray(current.answer) && current.answer.length > 0
    : !!current.answer

  return (
    <View style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity onPress={handleBack} style={styles.backIcon}>
        <MaterialIcons name="arrow-back" size={28} color="#00C6D3" />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressBackground}>
        <View
          style={[styles.progressFill, { width: `${progress * 100}%` }]}
        />
      </View>

      {/* Question counter */}
      <Text style={styles.counterText}>
        Question {index + 1} of {total}
      </Text>

      {/* Animated card */}
      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateY: contentAnim }] },
        ]}
      >
        <Text style={styles.questionTitle}>{current.title}</Text>

        {current.options.map((opt) => (
          <Option
            key={opt.value}
            label={opt.label}
            selected={
              current.multiple
                ? Array.isArray(current.answer) && current.answer.includes(opt.value)
                : current.answer === opt.value
            }
            onPress={() => handleSelect(opt.value)}
          />
        ))}
      </Animated.View>

      {/* Next / Finish */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          !isAnswered && { opacity: 0.4 },
        ]}
        disabled={!isAnswered}
        onPress={handleNext}
      >
        <Text style={styles.nextText}>
          {index === total - 1 ? t('common.finish') : t('common.next')}
        </Text>
      </TouchableOpacity>
    </View>
  )
})

export default QuestionnaireStep

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    padding: 20,
    marginTop: '2%',
  },

  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderWhite,
    marginBottom: 20,
  },

  progressBackground: {
    height: 10,
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 12,
  },

  progressFill: {
    height: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },

  counterText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },

  card: {
    width: '100%',
    paddingVertical: 10,
  },

  questionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  option: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    marginBottom: 10,
  },

  optionSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  optionText: {
    fontSize: 16,
  },

  optionTextSelected: {
    fontWeight: '600',
  },

  nextButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: '5%', 
  },

  nextText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
})
