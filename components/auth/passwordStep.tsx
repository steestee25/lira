import { COLORS } from '@/constants/color'
import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTranslation } from '../../lib/i18n'

interface Props {
  email: string
  password: string
  setPassword: (v: string) => void
  onBack: () => void
  onSignIn: () => void
  onSignUp: () => void
  loading: boolean
}

export default function PasswordStep({
  email,
  password,
  setPassword,
  onBack,
  onSignIn,
  onSignUp,
  loading,
}: Props) {
  const { t, locale } = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Animazione per blocco (titolo + input + bottoni)
  const contentAnim = useRef(new Animated.Value(0)).current

  const handleFocus = () => {
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  const handleBlur = () => {
    if (!password) {
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    }
  }

  const handleBackPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onBack()
  }

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSignIn()
  }

  const handleSignUp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSignUp()
  }

  const handleTogglePassword = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowPassword(!showPassword)
  }

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [110, -50], // move UP
  })

  const isWeb = Platform.OS === 'web'
  const titleOutputX = isWeb
    ? (locale === 'en' ? -260 : -250)
    : (locale === 'en' ? -90 : -70)

  const titleTranslateX = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, titleOutputX], // move LEFT
  })

  const titleFontSize = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 24], // font SMALLER
  })

  return (
    <View style={styles.container}>
      {/* Freccia BACK statica */}
      <TouchableOpacity onPress={handleBackPress} style={styles.backIcon}>
        <MaterialIcons name="arrow-back" size={28} color="#00C6D3" />
      </TouchableOpacity>

      {/* Blocco animato: titolo + input + bottoni */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.animatedBlock,
          { transform: [{ translateY: contentTranslateY }] },
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
          {t('auth.passwordStep.title')}
        </Animated.Text>

        <View style={styles.passwordContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Password"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={onSignIn}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoFocus
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleTogglePassword}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={24}
              color="#9292928a"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.signin]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>{t('auth.passwordStep.buttonNext')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupPrompt}>
          <Text style={styles.signupText}>{t('auth.passwordStep.noAccount')}</Text>
          <TouchableOpacity onPress={handleSignUp} disabled={loading}>
            <Text style={styles.signupLink}> {t('auth.passwordStep.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%' },

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

  // Blocco (titolo + input + bottoni) che parte più in basso
  animatedBlock: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 60, // parte più giù rispetto alla freccia
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },

  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
    width: '100%',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 16,
    paddingRight: 50,
    width: '100%',
  },

  iconButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
  },

  button: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
  },

  signup: {
    backgroundColor: '#2ec7e5d7',
  },

  signin: {
    backgroundColor: COLORS.primaryLight,
  },

  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },

  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  signupText: {
    fontSize: 14,
    color: '#5d5d5dff',
  },

  signupLink: {
    fontSize: 15,
    color: '#00C6D3',
    fontWeight: '600',
  },
})
