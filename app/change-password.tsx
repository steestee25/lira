import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS } from '../constants/color'
import { useTranslation } from '../lib/i18n'
import { supabase } from '../lib/supabase'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const handleUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t ? t('changePassword.errorFill') : 'Errore', t ? t('changePassword.errorFill') : 'Inserisci la nuova password e la conferma')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t ? t('changePassword.errorMismatch') : 'Errore', t ? t('changePassword.errorMismatch') : 'Le password non coincidono')
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
        router.back()
      }
    } catch (err) {
      console.log('Unexpected error updating password:', err)
      Alert.alert(t ? t('changePassword.errorTitle') : 'Errore', t ? t('changePassword.errorGeneric') : 'Si è verificato un errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backIcon}>
          <MaterialIcons name="arrow-back" size={28} color="#00C6D3" />
        </Pressable>
        <View />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t ? t('changePassword.title') : 'Change Password'}</Text>

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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, justifyContent: 'space-between' },
  backIcon: { width: 40, height: 40, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.borderWhite, marginBottom: 6 },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  label: { color: '#666', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 10, backgroundColor: '#fff' },
  button: { marginTop: 20, backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontWeight: '700' },
})
