import { Entypo, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from '../../constants/color';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';

const Avatar = ({ uri }: { uri?: string }) => (
  <View style={styles.avatarWrap}>
    <Image
      source={{ uri: 'https://picsum.photos/100' }}
      style={styles.avatar}
    />
  </View>
)

function RowItem({ icon, label, onPress, right }: { icon?: React.ReactNode; label: string; onPress?: () => void; right?: React.ReactNode }) {
  const Left = (
    <View style={styles.rowLeft}>
      <View style={styles.iconPlaceholder}>{icon ?? null}</View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.row} android_ripple={{ color: '#eee' }}>
        {Left}
        {right ?? <Text style={styles.chev}>›</Text>}
      </Pressable>
    )
  }

  return (
    <View style={styles.row}>
      {Left}
      {right ?? <Text style={styles.chev}>›</Text>}
    </View>
  )
}

export default function AboutScreen() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<any>(null)
    const [settingsVisible, setSettingsVisible] = useState(false)
    const { locale, setLocale, t } = useTranslation()
    const [isItalian, setIsItalian] = useState(locale === 'it')

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.log('Error fetching profile:', error.message || error)
          return
        }

        setProfile(data || null)
      } catch (err) {
        console.log('Unexpected error fetching profile:', err)
      }
    }

    fetchProfile()
  }, [session])

  const displayName = profile?.full_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User'
  const displayEmail = session?.user?.email || ''
  const avatarUri = session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`

  const handleLogout = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.log('Logout error:', error.message || error)
      }
    } catch (err) {
      console.log('Unexpected logout error:', err)
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: "#333", fontSize: 34, fontWeight: 'bold' }}>{t ? t('tabs.profile') : 'Profile'}</Text>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Avatar uri={avatarUri} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
          </View>
        </View>
        <Pressable style={styles.editBtn}>
          <Text style={styles.editText}>{t ? t('about.edit') : 'Edit'}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t ? t('about.accountSettings') : 'Account Settings'}</Text>
      <View style={styles.whiteCard}>
        <RowItem
          icon={<MaterialCommunityIcons name="account" size={24} color={COLORS.temp} />}
          label={t ? t('about.accountInformation') : 'Account Information'}
        />
        <RowItem
          icon={<MaterialCommunityIcons name="form-textbox-password" size={24} color={COLORS.temp} />}
          label={t ? t('about.changePassword') : 'Change Password'}
        />
        <RowItem
          icon={<MaterialCommunityIcons name="devices" size={24} color={COLORS.temp} />}
          label={t ? t('about.device') : 'Device'}
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t ? t('settings.title') : 'Settings'}</Text>
      <View style={styles.whiteCard}>
        <RowItem
          icon={<Feather name="settings" size={22} color="black" />}
          label={t ? t('settings.title') : 'Settings'}
          onPress={() => setSettingsVisible(true)}
        />
        <RowItem
          icon={<MaterialCommunityIcons name="assistant" size={22} color={COLORS.temp} />}
          label={t ? t('about.helpSupport') : 'Help & Support'}
        />
        <RowItem
          icon={<MaterialCommunityIcons name="information-slab-symbol" size={36} color={COLORS.temp} />}
          label={t ? t('about.aboutLabel') : 'About'}
        />
      </View>
      
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        statusBarTranslucent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlayFill} onPress={() => setSettingsVisible(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>{t ? t('settings.title') : 'Settings'}</Text>
            <RowItem
              icon={<Entypo name="language" size={24} color="black" />}
              label={t ? t('settings.language') : 'Language'}
              right={(
                  <View style={styles.langRight}>
                    <Text style={styles.langText}>{isItalian ? 'Italiano' : 'English'}</Text>
                    <Switch
                      value={isItalian}
                      onValueChange={async (val) => {
                        console.log('Language switch toggled ->', val)
                        setIsItalian(val)
                        const newLocale = val ? 'it' : 'en'
                        try {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        } catch (e) {
                          // ignore
                        }
                        setLocale(newLocale as any)
                      }}
                    />
                  </View>
              )}
            />
              <Text style={styles.langHint}>{t ? t('settings.languageHint') : 'Switch app language between Italiano and English'}</Text>
          </View>
        </View>
      </Modal>
      
      <Pressable
        onPress={handleLogout}
        style={styles.redCard}
        android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      >
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconPlaceholder}>
              <MaterialCommunityIcons name="logout" size={22} color={COLORS.white} />
            </View>
            <Text style={[styles.rowLabel, { color: '#fff' }]}>{t ? t('about.logout') : 'Logout'}</Text>
          </View>
          <Text style={[styles.chev, { color: '#fff' }]}>›</Text>
        </View>
      </Pressable>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingBottom: 20 },
  // leave space so content doesn't scroll under the tab bar
  scroll: { flex: 1, marginBottom: 85 },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  email: { color: '#7b6f8b', marginTop: 2 },
  editBtn: {
    backgroundColor: COLORS.primaryLightOpacity,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  editText: { color: COLORS.primaryLightOpacityFill, fontWeight: '600' },
  sectionTitle: { color: COLORS.temp, fontSize:16, marginTop:'3%', marginBottom: 8, fontWeight: '500' },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    paddingTop:10,
    paddingBottom:10,
    marginBottom: 12,
    elevation: 2,
  },
  redCard: {
    backgroundColor: COLORS.red,
    borderRadius: 12,
    padding: 15,
    marginTop: '5%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#efe6ff',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, color: COLORS.temp, fontWeight: '500' },
  chev: { color: '#bdb3c8', fontSize: 20},
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  overlayFill: { flex: 1 },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    elevation: 6,
  },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: '2%', marginBottom: 8 },
  langRight: { flexDirection: 'row', alignItems: 'center' },
  langText: { marginRight: 8, color: '#333', fontWeight: '600' },
  langHint: { color: '#6b6b6b', fontSize: 12, marginTop: 10 },
})