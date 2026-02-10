import { Entypo, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/color';

export default function TabLayout() {
    const router = useRouter();

    const handleNewMessage = () => {
        // Send event to reset messages in chat screen
        // Use Date.now() to ensure a new value each time
        router.setParams({ resetMessages: Date.now().toString() });
    };

    const HeaderButton = ({ onPress, children, style }: any) => (
        <TouchableOpacity onPress={onPress} style={[styles.headerButton, style]}>{children}</TouchableOpacity>
    );

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#9CF1F0',
                headerStyle: {
                    backgroundColor: COLORS.white,
                },
                headerShadowVisible: false,
                headerTintColor: '#007bff',
                tabBarStyle: {
                    position: 'absolute',
                    marginHorizontal: 10,
                    bottom: 25,
                    height: 65,
                    borderRadius: 35,
                    backgroundColor: COLORS.white,
                    shadowColor: '#000',
                },
                tabBarIconStyle: {
                    marginTop: 12.5,
                },

            }}
        >
            <Tabs.Screen name="home"
                options={{
                    title: '',
                    tabBarIcon: ({ color, focused }) => (
                        <Octicons name={focused ? 'home-fill' : 'home'} color={color} size={24} />
                    ),
                    headerShown: false,
                }} />

            <Tabs.Screen name="chat"
                options={{
                    title: '',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} size={26} />
                    ),
                    headerStyle: { backgroundColor: COLORS.white },
                    headerShown: true,
                    headerLeft: () => (
                        <View style={{ marginLeft: 12 }}>
                            <HeaderButton onPress={() => { /* open menu */ }}>
                                <FontAwesome6 name="bars-staggered" size={20} color={COLORS.temp3} />
                            </HeaderButton>
                        </View>
                    ),
                    headerRight: () => (
                        <View style={styles.headerRightContainer}>
                            <HeaderButton onPress={handleNewMessage}>
                                <MaterialCommunityIcons name="shape-square-rounded-plus"
                                    size={28} color={COLORS.temp3} />
                            </HeaderButton>
                            <HeaderButton style={{ marginLeft: 12 }} onPress={() => { /* more */ }}>
                                <Entypo name="dots-three-vertical" size={20} color={COLORS.temp3} />
                            </HeaderButton>
                        </View>
                    ),
                    tabBarStyle: { display: 'none' },
                }} />

            <Tabs.Screen
                name="advices"
                options={{
                    title: '',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} color={color} size={24} />
                    ),
                    headerShown: false,
                }}
            />

            <Tabs.Screen
                name="about"
                options={{
                    title: '',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
                    ),
                    headerShown: false,
                }}
            />
        </Tabs>
    )
}

const styles = StyleSheet.create({
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.temp,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
});
