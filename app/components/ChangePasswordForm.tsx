import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS } from '../../constants/color'
import { useTranslation } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'

type Props = {
  onDone?: () => void
}

export default function ChangePasswordForm({ onDone }: Props) {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t ? t('changePassword.errorTitle') : 'Errore', t ? t('changePassword.errorFill') : 'Inserisci la nuova password e la conferma')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t ? t('changePassword.errorTitle') : 'Errore', t ? t('changePassword.errorMismatch') : 'Le password non coincidono')
      return
    }

    setLoading(true)
    try {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) } catch (e) {}

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        console.log('Password update error:', error)
        Alert.alert(t ? t('changePassword.errorTitle') : 'Errore', error.message || (t ? t('changePassword.errorGeneric') : 'Impossibile aggiornare la password'))
      } else {
        Alert.alert(t ? t('changePassword.successTitle') : 'Successo', t ? t('changePassword.successMessage') : 'Password aggiornata')
        if (onDone) onDone()
      }
    } catch (err) {
      console.log('Unexpected error updating password:', err)
      Alert.alert(t ? t('changePassword.errorTitle') : 'Errore', t ? t('changePassword.errorGeneric') : 'Si è verificato un errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Text style={styles.label}>{t ? t('changePassword.newLabel') : 'New password'}</Text>
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
        placeholder="••••••••"
      />

      <Text style={styles.label}>{t ? t('changePassword.confirmLabel') : 'Confirm password'}</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        placeholder="••••••••"
      />

      <Pressable onPress={handleUpdate} style={styles.button} android_ripple={{ color: '#eee' }} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? (t ? t('changePassword.updating') : 'Updating...') : (t ? t('changePassword.updateButton') : 'Update password')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: '#666', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 10, backgroundColor: '#fff' },
  button: { marginTop: 20, backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontWeight: '700' },
})
