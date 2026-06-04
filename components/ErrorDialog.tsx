import { useTranslation } from '@/lib/i18n'
import { MaterialIcons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native'
import errorDialogStyles from '../styles/components/errorDialog.styles'

type Props = {
  visible: boolean
  message: string
  onClose: () => void
}

export default function ErrorDialog({ visible, message, onClose }: Props) {
  const { t } = useTranslation()
  const scale = useRef(new Animated.Value(0.8)).current
  const opacity = useRef(new Animated.Value(0)).current
  // Try to translate `message` prop. The prop may be either a translation key
  // or a plain English string coming from the backend. We first attempt
  // `t(message)` (in case callers pass a translation key). If that returns
  // the same value, try to look into `errors.<message>` entries in locales
  // (we allow spaces in keys so backend english messages can be mapped).
  const displayedMessage = (() => {
    const byKey = t(message)
    if (byKey !== message) return byKey
    const byErrorMap = t(`errors.${message}`)
    if (byErrorMap !== `errors.${message}`) return byErrorMap
    return message
  })()

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, opacity, scale])

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <MaterialIcons name="error-outline" size={36} color="#ff5f5f" />
          <Text style={styles.title}>{t('errorDialog.title')}</Text>
          <Text style={styles.message}>{displayedMessage}</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.btnText}>{t('errorDialog.ok')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = errorDialogStyles

