import { useTranslation } from '@/lib/i18n'
import { MaterialIcons } from '@expo/vector-icons'
import React, { useEffect, useRef } from 'react'
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from '../constants/color'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDestructive = false,
}: Props) {
  const { t } = useTranslation()
  const scale = useRef(new Animated.Value(0.8)).current
  const opacity = useRef(new Animated.Value(0)).current

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

  const confirmBtnColor = isDestructive ? COLORS.red : COLORS.primaryLight
  const iconColor = isDestructive ? '#ff5f5f' : '#4CAF50'
  const iconName = isDestructive ? 'delete-outline' : 'help-outline'

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent={true} onRequestClose={onCancel}>
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
          <MaterialIcons name={iconName} size={36} color={iconColor} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>{cancelText || t('common.cancel') || 'Annulla'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: confirmBtnColor }]} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>{confirmText || t('common.confirm') || 'Conferma'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  card: {
    width: '80%',
    maxWidth: 320,
    padding: 25,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  } as any,
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    color: '#333',
  } as any,
  message: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    color: '#666',
    maxWidth: '95%',
  } as any,
  buttonContainer: {
    marginTop: 25,
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  } as any,
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  } as any,
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  } as any,
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  } as any,
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  } as any,
}
