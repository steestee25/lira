import Lottie from 'lottie-react'
import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import animationData from '../assets/lottie/coin_bounce.json'
import { useTranslation } from '../lib/i18n'

type Props = {
  onFinish: () => void
}

export default function CelebrationScreen({ onFinish }: Props) {
  const { t } = useTranslation()
  const hasFinished = useRef(false)

  const handleFinish = useCallback(() => {
    if (hasFinished.current) return
    hasFinished.current = true
    onFinish()
  }, [onFinish])

  useEffect(() => {
    const timer = setTimeout(handleFinish, 5200)
    return () => clearTimeout(timer)
  }, [handleFinish])

  return (
    <View style={styles.container}>
      <div style={{ width: 130, height: 130 }}>
        <Lottie 
          animationData={animationData} 
          loop={false} 
          autoplay={true}
          onComplete={handleFinish}
        />
      </div>
      <Text style={styles.title}>{t('celebration.congrats')}</Text>
      <Text style={styles.subtitle}>{t('celebration.message')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: '10%',
    color: '#1c1c1c',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
  },
})
