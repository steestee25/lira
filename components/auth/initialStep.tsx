import Ionicons from '@expo/vector-icons/Ionicons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import LanguageSelector from '@/components/LanguageSelector'
import { COLORS } from '@/constants/color'
import { useTranslation } from '../../lib/i18n'

interface Props {
  onNext: () => void
  onAccessExisting?: () => void
  loading: boolean
}

export default function InitialStep({ onNext, onAccessExisting, loading }: Props) {
  const { t, setLocale, locale } = useTranslation()

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onNext()
  }

  const handleExistingPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (onAccessExisting) {
      onAccessExisting()
      return
    }
    onNext()
  }

  return (
    <View style={styles.container}>
      <LanguageSelector
        selectedKey={locale}
        onSelect={(lang) => setLocale(lang)}
      />

      <View style={styles.logoView}>
        <Image
          source={require('../../assets/images/coin_logo_no_bg.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Image
        source={require('../../assets/images/main3.png')}
        style={styles.heroImage}
        resizeMode="contain"
      />

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handlePress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('auth.initialStep.buttonNext')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.initialStep.orLabel')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleExistingPress}
          disabled={loading}
        >
          <View style={styles.secondaryContent}>
            <View style={styles.secondaryIcon}>
              <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
            </View>

            <View style={styles.secondaryTextGroup}>
              <Text style={styles.secondaryTitle}>{t('auth.initialStep.existingProfileTitle')}</Text>
              <Text style={styles.secondarySubtitle}>{t('auth.initialStep.existingProfileSubtitle')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 20,
  },
  logoView: {
    height: 80,
    width: 80,
    backgroundColor: COLORS.temp2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 24,
    marginTop: Platform.OS === 'web' ? '3%' : '10%',
  },
  logo: {
    width: 60,
    height: 60,
  },
  heroImage: {
    width: '100%',
    maxWidth: 520,
    height: 450,
    alignSelf: 'center',
    marginTop: Platform.OS === 'web' ? '-6%' : '-10%',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 520,
    marginTop: Platform.OS === 'web' ? '-5%' : '-10%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderRadius: 18,
    shadowColor: COLORS.temp,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.temp,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLightOpacity,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  secondarySubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },
})
