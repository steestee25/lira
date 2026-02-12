import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from '../constants/color'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../lib/i18n'
import { supabase } from '../lib/supabase'

const Avatar = ({ uri }: { uri?: string }) => (
    <View style={styles.avatarWrap}>
        <Image
            source={{ uri: uri || 'https://picsum.photos/100' }}
            style={styles.avatar}
        />
    </View>
)

export default function AccountScreen() {
    const router = useRouter()
    const { session } = useAuth()
    const { t } = useTranslation()
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        if (!session?.user?.id) return

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
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
    const avatarUri = session?.user?.user_metadata?.avatar_url || 'https://picsum.photos/100'

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                    <MaterialIcons name="arrow-back" size={28} color="#00C6D3" />
                </TouchableOpacity>
                <View />
                <View style={{ width: 40 }} />
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
                </View>

                <Text style={styles.sectionTitle}>{t ? t('about.accountSettings') : 'Account Details'}</Text>
                <View style={styles.whiteCard}>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Full name</Text>
                        <Text style={styles.chev}>{profile?.full_name ?? '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Email</Text>
                        <Text style={styles.chev}>{displayEmail}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Phone</Text>
                        <Text style={styles.chev}>{profile?.phone ?? '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Country</Text>
                        <Text style={styles.chev}>{profile?.country ?? 'Italy'}</Text>
                    </View>
                </View>

                <Pressable
                    onPress={async () => {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        } catch (e) {
                            // ignore
                        }
                        console.log('Cancella account pressed')
                    }}
                    style={styles.redCard}
                    android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
                >
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <View style={styles.iconPlaceholderWhite}>
                                <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.white} />
                            </View>
                            <Text style={[styles.rowLabel, { color: '#fff' }]}>Cancella account</Text>
                        </View>
                        <Text style={[styles.chev, { color: '#fff', fontSize: 20 }]}>›</Text>
                    </View>
                </Pressable>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { padding: 20, paddingBottom: 20 },
    scroll: { flex: 1, marginBottom: 85 },
    backIcon: {
        width: 40,
        height: 40,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.borderWhite,
        marginBottom: 6,
    },
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
    sectionTitle: { color: COLORS.temp, fontSize: 16, marginTop: '3%', marginBottom: 8, fontWeight: '500' },
    whiteCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 12,
        elevation: 2,
    },
    redCard: {
        backgroundColor: COLORS.red,
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 18,
        marginTop: '5%',
    },
    iconPlaceholderWhite: {
        width: 38,
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fff',
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },

    rowLabel: { fontSize: 15, color: COLORS.temp, fontWeight: '500' },
    chev: { color: '#6b6b6b', fontSize: 15 },
})
