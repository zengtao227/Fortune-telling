import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { THEMES, getTheme } from './src/theme';
import { resolveIChingMessage, resolveAstrologyMessage, resolveAlmanacMessage } from './src/utils/contentResolver';

export default function App() {
    const [themeMode, setThemeMode] = useState(THEMES.TAROT);
    const theme = getTheme(themeMode);

    const toggleTheme = () => {
        const nextTheme = themeMode === THEMES.TAROT ? THEMES.ZEN : THEMES.TAROT;
        setThemeMode(nextTheme);
        // Dynamic haptics based on user preference
        if (nextTheme === THEMES.ZEN) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const [dailyMessage, setDailyMessage] = useState(resolveAlmanacMessage('yi'));

    const refreshFortune = () => {
        setDailyMessage(resolveAlmanacMessage('yi'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={themeMode === THEMES.TAROT ? 'light' : 'dark'} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.accent }]}>
                        {themeMode === THEMES.TAROT ? 'MYSTIC TAROT' : 'ZEN AESTHETIC'}
                    </Text>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
                        <Text style={{ color: theme.secondary }}>一键切换主题</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.accent }]}>今日能量胶囊</Text>
                    <Text style={[styles.message, { color: theme.text }]}>{dailyMessage}</Text>
                    <TouchableOpacity
                        onPress={refreshFortune}
                        style={[styles.button, { borderColor: theme.accent }]}
                    >
                        <Text style={{ color: theme.accent }}>重新开启</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    <TouchableOpacity style={[styles.miniCard, { backgroundColor: theme.surface }]}>
                        <Text style={{ color: theme.accent }}>易经起卦</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniCard, { backgroundColor: theme.surface }]}>
                        <Text style={{ color: theme.accent }}>西占星历</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 2,
    },
    card: {
        width: '100%',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 18,
        marginBottom: 20,
        opacity: 0.8,
    },
    message: {
        fontSize: 20,
        lineHeight: 32,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
    },
    grid: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 15,
    },
    miniCard: {
        flex: 1,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    }
});
