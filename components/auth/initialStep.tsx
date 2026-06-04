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

// Receives callback and loading state as props 
interface Props {
  onNext: () => void
  loading: boolean
}

export default function InitialStep({ onNext, loading }: Props) {
  const { t, setLocale, locale } = useTranslation()
  
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onNext()
  }

  return (
    <View style={{ width: '100%' }}>
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
        style={{ width: Platform.OS === 'web' ? '65%' : '105%', height: 450, alignSelf: 'center', marginTop: Platform.OS === 'web' ? '2%' : '0%' }}
        resizeMode="contain"
      />

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={styles.buttonContentRow}>
              <Text style={styles.buttonText}>{t('auth.initialStep.buttonNext')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  logoView: {
    height: 80,
    width: 80,
    backgroundColor: COLORS.temp2,
    alignContent: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: Platform.OS === 'web' ? '3%' : '10%',
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  verticallySpaced: {
    paddingVertical: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: Platform.OS === 'web' ? '5%' : '0%',
  },
  button: {
    backgroundColor: COLORS.primaryLight,
    padding: 15,
    alignItems: 'center',
    borderRadius: 15,
  },
  buttonIcon: {
    marginRight: 8
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  },
})
