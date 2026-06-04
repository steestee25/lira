import { COLORS } from '@/constants/color'
import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useTranslation } from '../../lib/i18n'

interface Props {
  email: string
  setEmail: (v: string) => void
  onNext: () => void
  onBack: () => void
}

export default function EmailStep({ email, setEmail, onNext, onBack }: Props) {
  const { t, locale } = useTranslation()
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Animation for ONLY title, input, button
  const contentAnim = useRef(new Animated.Value(0)).current

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

  const handleNext = async () => {
    if (!isValidEmail(email)) {
      setError('Email non valida')
      return
    }
    setError('')
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onNext()
  }

  const handleBackPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onBack()
  }

  const handleFocus = () => {
    setIsFocused(true)
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  const handleBlur = () => {
    if (!email) {
      setIsFocused(false)
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }
  }

  // Move block upward slightly but NEVER into the back arrow (max 50px)
  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [110, -50], // move UP
  })

  const isWeb = Platform.OS === 'web'
  const titleOutputX = isWeb
    ? (locale === 'en' ? -270 : -250)
    : (locale === 'en' ? -90 : -70)

  const titleTranslateX = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, titleOutputX], // move LEFT (lang-specific, web variant)
  })

  const titleFontSize = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 24], // font SMALLER
  })

  return (
    <View style={styles.container}>

      {/* FIXED Back Arrow */}
      <TouchableOpacity onPress={handleBackPress} style={styles.backIcon}>
        <MaterialIcons name="arrow-back" size={28} color="#00C6D3" />
      </TouchableOpacity>

      {/* ANIMATED CONTENT (starts lower + stays under back arrow) */}
      <Animated.View
      pointerEvents="box-none"
        style={[
          styles.animatedBlock,
          { transform: [{ translateY: contentTranslateY }] }
        ]}
      >
        <Animated.Text
          style={[
            styles.title,
            {
              fontSize: titleFontSize,
              transform: [{ translateX: titleTranslateX }],
            },
          ]}
        >
          {t('auth.emailStep.title')}
        </Animated.Text>

        <TextInput
          style={[
            styles.input,
            error ? { borderColor: 'red' } : {},
          ]}
          onChangeText={(text) => {
            setEmail(text)
            if (error && isValidEmail(text)) setError('')
          }}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleNext}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.button,
            error ? { marginTop: 10 } : { marginTop: 15 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{t('auth.emailStep.buttonNext')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderWhite,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  // The 3 components BEGIN lower on the screen
  animatedBlock: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 60, // << pushes content DOWN → no overlap with back arrow
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 16,
    width: '100%',
  },

  errorText: {
    color: 'red',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    alignSelf: 'flex-start'
  },

  button: {
    backgroundColor: COLORS.primaryLight,
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
    width: '100%',
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
})
