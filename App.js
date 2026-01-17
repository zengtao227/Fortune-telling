import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { NotoSerifSC_400Regular, NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { THEMES, getTheme } from './src/theme';
import { resolveAlmanacMessage, resolveIChingMessage, resolveAstrologyMessage } from './src/utils/contentResolver';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function App() {
    const [themeMode, setThemeMode] = useState(THEMES.TAROT);
    const theme = getTheme(themeMode);

    let [fontsLoaded] = useFonts({
        Cinzel_700Bold,
        NotoSerifSC_400Regular,
        NotoSerifSC_700Bold,
        Inter_400Regular,
    });

    const toggleTheme = () => {
        const nextTheme = themeMode === THEMES.TAROT ? THEMES.ZEN : THEMES.TAROT;
        setThemeMode(nextTheme);
        if (Platform.OS !== 'web') {
            if (nextTheme === THEMES.ZEN) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    };

    const [displayMode, setDisplayMode] = useState('almanac'); // 'almanac', 'iching', 'astro'
    const [cardContent, setCardContent] = useState({
        title: '今日能量胶囊',
        message: resolveAlmanacMessage('yi'),
        type: 'almanac'
    });

    const refreshFortune = () => {
        let newContent = {};
        if (displayMode === 'almanac') {
            newContent = {
                title: '今日能量胶囊',
                message: resolveAlmanacMessage('yi'),
                type: 'almanac'
            };
        } else if (displayMode === 'iching') {
            const hexagrams = ['乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '地雷复', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒', '天山遁'];
            const randomHex = hexagrams[Math.floor(Math.random() * hexagrams.length)];
            // Dynamic import fix: ensure we have the resolving logic
            const msg = resolveIChingMessage(randomHex);
            newContent = {
                title: `易经 · ${randomHex}`,
                message: msg || "静心诚意，答案自现。",
                type: 'iching'
            };
        } else if (displayMode === 'astro') {
            const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'];
            const randomPlanet = planets[Math.floor(Math.random() * planets.length)];
            const planetProcess = { Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星' };
            const msg = resolveAstrologyMessage(randomPlanet);
            newContent = {
                title: `星历 · ${planetProcess[randomPlanet]}`,
                message: msg || "星辰指引，静候佳音。",
                type: 'astro'
            };
        }

        setCardContent(newContent);

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const switchToMode = (mode) => {
        // Update mode then refresh content immediately
        if (mode === 'iching') {
            const hexagrams = ['乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '地雷复', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒', '天山遁'];
            const randomHex = hexagrams[Math.floor(Math.random() * hexagrams.length)];
            const msg = resolveIChingMessage(randomHex);
            setCardContent({
                title: `易经 · ${randomHex}`,
                message: msg,
                type: 'iching'
            });
            setDisplayMode('iching');
        } else if (mode === 'astro') {
            const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'];
            const randomPlanet = planets[Math.floor(Math.random() * planets.length)];
            const planetProcess = { Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星' };
            const msg = resolveAstrologyMessage(randomPlanet);
            setCardContent({
                title: `星历 · ${planetProcess[randomPlanet]}`,
                message: msg,
                type: 'astro'
            });
            setDisplayMode('astro');
        } else {
            setCardContent({
                title: '今日能量胶囊',
                message: resolveAlmanacMessage('yi'),
                type: 'almanac'
            });
            setDisplayMode('almanac');
        }

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    if (!fontsLoaded) {
        return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    }

    return (
        <LinearGradient
            colors={theme.backgroundGradient}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar style={themeMode === THEMES.TAROT ? 'light' : 'dark'} />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.webContainer}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                                {themeMode === THEMES.TAROT ? 'MYSTIC TAROT' : 'ZEN AESTHETIC'}
                            </Text>
                            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
                                <Text style={[styles.toggleText, { color: theme.secondary, fontFamily: theme.fontBody }]}>
                                    切换境地
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <LinearGradient
                            colors={theme.cardGradient}
                            style={[styles.card, theme.shadow, { borderColor: theme.border }]}
                        >
                            <Text style={[styles.cardTitle, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                                {cardContent.title}
                            </Text>
                            <Text style={[styles.message, { color: theme.text, fontFamily: theme.fontBody }]}>
                                {cardContent.message}
                            </Text>
                            <TouchableOpacity
                                onPress={refreshFortune}
                                style={[styles.button, { borderColor: theme.accent }]}
                            >
                                <Text style={[styles.buttonText, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                                    {displayMode === 'almanac' ? '重新开启' : '再问一次'}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        <View style={styles.grid}>
                            <TouchableOpacity
                                onPress={() => switchToMode('iching')}
                                style={[styles.miniCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: displayMode === 'iching' ? 1 : 0.7 }]}
                            >
                                <Text style={[styles.miniText, { color: theme.accent, fontFamily: theme.fontTitle }]}>易经起卦</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => switchToMode('astro')}
                                style={[styles.miniCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: displayMode === 'astro' ? 1 : 0.7 }]}
                            >
                                <Text style={[styles.miniText, { color: theme.accent, fontFamily: theme.fontTitle }]}>西占星历</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => switchToMode('almanac')}
                                style={[styles.miniCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: displayMode === 'almanac' ? 1 : 0.7 }]}
                            >
                                <Text style={[styles.miniText, { color: theme.accent, fontFamily: theme.fontTitle }]}>每日胶囊</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 60,
    },
    webContainer: {
        width: '100%',
        maxWidth: 500, // Constrain width for premium feel on web
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 40,
    },
    title: {
        fontSize: 26,
        letterSpacing: 2,
    },
    toggleText: {
        fontSize: 14,
        opacity: 0.8,
    },
    card: {
        width: '100%',
        padding: 40,
        borderRadius: 30,
        alignItems: 'center',
        borderWidth: 1,
        backdropFilter: 'blur(10px)', // For web support
    },
    cardTitle: {
        fontSize: 14,
        letterSpacing: 4,
        marginBottom: 25,
        opacity: 0.6,
        textTransform: 'uppercase',
    },
    message: {
        fontSize: 22,
        lineHeight: 38,
        textAlign: 'center',
        marginBottom: 35,
        fontWeight: '300',
    },
    button: {
        paddingHorizontal: 35,
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1.5,
    },
    buttonText: {
        fontSize: 16,
        letterSpacing: 2,
    },
    grid: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 20,
        width: '100%',
    },
    miniCard: {
        flex: 1,
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    miniText: {
        fontSize: 16,
        letterSpacing: 1,
    }
});

