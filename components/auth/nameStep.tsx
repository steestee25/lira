import { COLORS } from '@/constants/color'
import * as Haptics from 'expo-haptics'
import React, { useRef, useState } from 'react'
import {
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
    name: string
    setName: (v: string) => void
    onNext: () => void
}

export default function NameStep({ name, setName, onNext }: Props) {
    const { t, locale } = useTranslation()
    const [error, setError] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Animation for ONLY title, input, button
    const contentAnim = useRef(new Animated.Value(0)).current

    const handleNext = async () => {
        if (!name.trim()) {
            setError('Please insert your name')
            return
        }
        setError('')
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onNext()
    }

    const handleFocus = () => {
        setIsFocused(true)
        Animated.timing(contentAnim, {
            toValue: 1,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start()
    }

    const handleBlur = () => {
        if (!name.trim()) {
            setIsFocused(false)
            Animated.timing(contentAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start()
        }
    }

    // Move block upward slightly but NEVER into the back arrow (max 50px)
    const contentTranslateY = contentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [110, -50], // move UP
    })

    const isWeb = Platform.OS === 'web'
    const titleOutputX = isWeb
        ? (locale === 'en' ? -255 : -250)
        : (locale === 'en' ? -80 : -100)

    const titleTranslateX = contentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, titleOutputX], // move LEFT (lang-specific)
    })

    const titleFontSize = contentAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [28, 24], // font SMALLER
    })

    return (
        <View style={styles.container}>
            {/* ANIMATED CONTENT (starts lower + stays under back arrow) */}
            <Animated.View
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
                    {t('auth.nameStep.title')}
                </Animated.Text>

                <TextInput
                    style={[
                        styles.input,
                        error ? { borderColor: 'red' } : {},
                    ]}
                    value={name}
                    onChangeText={(text) => {
                        setName(text)
                        if (error && text.trim()) setError('')
                    }}
                    placeholder="Charles"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={handleNext}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                    style={[
                        styles.button,
                        error ? { marginTop: 10 } : { marginTop: 15 },
                    ]}
                    onPress={handleNext}
                >
                    <Text style={styles.buttonText}>{t('auth.nameStep.buttonNext')}</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },

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

    animatedBlock: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 60,
    },

    title: {
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        width: '100%',
    },

    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 15,
        padding: 16,
        width: '100%',
    },

    errorText: {
        color: 'red',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
        alignSelf: 'flex-start',
    },

    button: {
        backgroundColor: COLORS.primaryLight,
        padding: 15,
        alignItems: 'center',
        borderRadius: 15,
        width: '100%',
    },

    buttonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
})
