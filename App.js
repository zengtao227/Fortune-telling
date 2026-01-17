import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated, Dimensions, Platform, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { NotoSerifSC_400Regular, NotoSerifSC_700Bold } from '@expo-google-fonts/noto-serif-sc';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { THEMES, getTheme } from './src/theme';
import { resolveAlmanacMessage, resolveIChingMessage, resolveAstrologyMessage } from './src/utils/contentResolver';
import { getHexagramLines } from './src/logic/iching';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// --- Components ---

const StarBackground = () => {
    // Simple twinkling stars using Opacity + Layout
    // In a real app we'd use a lot of Animated.Values, but here we keep it performant for web
    // with CSS-like keyframes or just static random placement for the MVP "premium" feel
    const stars = Array.from({ length: 30 }).map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 3 + 1,
        opacity: Math.random()
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            {stars.map(s => (
                <View
                    key={s.key}
                    style={{
                        position: 'absolute',
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        borderRadius: s.size / 2,
                        backgroundColor: '#FFF',
                        opacity: s.opacity,
                    }}
                />
            ))}
        </View>
    );
};

const HexagramVisual = ({ name, lines }) => {
    // lines: array of 0 (yin/broken) or 1 (yang/solid). Bottom to top.
    // We render them top to bottom visually, so we reverse for display? 
    // Usually Hexagrams are drawn bottom-up logic, but rendered top-down stack.
    // Index 0 in our array is Bottom line.

    // Reverse to render from Top line (index 5) to Bottom line (index 0)
    const displayLines = [...lines].reverse();

    return (
        <View style={styles.hexagramContainer}>
            {displayLines.map((val, idx) => (
                <View key={idx} style={styles.lineRow}>
                    {val === 1 ? (
                        <View style={styles.yangLine} />
                    ) : (
                        <View style={styles.yinLineContainer}>
                            <View style={styles.yinLinePart} />
                            <View style={styles.yinLineGap} />
                            <View style={styles.yinLinePart} />
                        </View>
                    )}
                </View>
            ))}
            <Text style={styles.hexName}>{name}</Text>
        </View>
    );
};

const AstrologyForm = ({ onSubmit, theme }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');

    return (
        <View style={styles.formContainer}>
            <Text style={[styles.label, { color: theme.secondary }]}>你的名字 (Name)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={name}
                onChangeText={setName}
                placeholder="Mystic Seeker"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={[styles.label, { color: theme.secondary }]}>出生日期 (YYYY-MM-DD)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={date}
                onChangeText={setDate}
                keyboardType="numeric"
                placeholder="2000-01-01"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={[styles.label, { color: theme.secondary }]}>出生地点 (Location)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Shanghai, China"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <TouchableOpacity
                style={[styles.calculateButton, { backgroundColor: theme.accent }]}
                onPress={() => onSubmit({ name, date, location })}
            >
                <Text style={styles.calculateButtonText}>绘制星盘 (CALCULATE)</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function App() {
    const [fontsLoaded] = Font.useFonts({
        Cinzel_700Bold,
        NotoSerifSC_400Regular,
        NotoSerifSC_700Bold,
        Inter_400Regular,
    });

    const [themeMode, setThemeMode] = useState(THEMES.TAROT);
    const theme = getTheme(themeMode);

    // Views: 'HOME', 'ICHING', 'ASTRO', 'RESULT_IC', 'RESULT_AS'
    const [currentView, setCurrentView] = useState('HOME');
    const [resultData, setResultData] = useState(null);

    // Astro Logic
    const handleAstroSubmit = (formData) => {
        // Mock calculation based on hash of input to make it feel deterministic
        // In real app, this would call an ephemeris library
        if (!formData.date) return;

        const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'];
        // Simple hash
        const hash = (formData.date.length + (formData.location?.length || 0)) % planets.length;
        const planet = planets[hash];
        const planetNameMap = { Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星' };

        const msg = resolveAstrologyMessage(planet);

        setResultData({
            title: `命宫主星 · ${planetNameMap[planet]}`,
            message: msg || "星轨流转，你的命运此刻正在上升。",
            extra: `基于 ${formData.date} 在 ${formData.location || '未知领域'} 的星图推演`
        });
        setCurrentView('RESULT_AS');
        if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Iching Logic
    const handleIchingStart = () => {
        // Animation simulation could go here
        const hexagrams = Object.keys(getHexagramLines("乾为天") ? { "乾为天": 0 } : {}); // Just a hack to get keys if I had the object exposed, but wait, I exported helper, not list.
        // Let's use the hardcoded list from App.js previously or just pick random because logic is in contentResolver + visual helper
        const hexList = ['乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '地雷复', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒', '天山遁'];
        const randomHex = hexList[Math.floor(Math.random() * hexList.length)];

        const lines = getHexagramLines(randomHex);
        const msg = resolveIChingMessage(randomHex);

        setResultData({
            title: `本卦 · ${randomHex}`,
            message: msg,
            lines: lines || [1, 1, 1, 1, 1, 1] // Fallback
        });
        setCurrentView('RESULT_IC');
        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

    return (
        <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
            <StatusBar style="light" />
            <StarBackground />

            <View style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.appTitle, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                        MYSTIC TAROT
                    </Text>
                    <TouchableOpacity onPress={() => setCurrentView('HOME')} style={styles.homeBtn}>
                        <Text style={{ color: theme.secondary, fontSize: 12 }}>HOME</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <ScrollView contentContainerStyle={styles.scroll}>

                    {currentView === 'HOME' && (
                        <View style={styles.cardContainer}>
                            <Text style={[styles.introText, { color: theme.text }]}>选择你的探寻之路</Text>

                            <TouchableOpacity
                                style={[styles.menuCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
                                onPress={() => setCurrentView('ASTRO')}
                            >
                                <Text style={[styles.cardTitle, { color: theme.accent }]}>西洋占星 (Astrology)</Text>
                                <Text style={[styles.cardDesc, { color: theme.secondary }]}>绘制出生星盘，探寻行星指引</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.menuCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
                                onPress={handleIchingStart}
                            >
                                <Text style={[styles.cardTitle, { color: theme.accent }]}>周易起卦 (I Ching)</Text>
                                <Text style={[styles.cardDesc, { color: theme.secondary }]}>六十四卦象，参悟变易之道</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {currentView === 'ASTRO' && (
                        <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Text style={[styles.sectionTitle, { color: theme.accent }]}>输入星盘信息</Text>
                            <AstrologyForm onSubmit={handleAstroSubmit} theme={theme} />
                        </View>
                    )}

                    {currentView === 'RESULT_AS' && (
                        <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <Text style={[styles.resultTitle, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                                {resultData.title}
                            </Text>
                            <Text style={[styles.resultMeta, { color: theme.secondary }]}>
                                {resultData.extra}
                            </Text>
                            <View style={styles.divider} />
                            <Text style={[styles.messageText, { color: theme.text }]}>
                                {resultData.message}
                            </Text>
                            <TouchableOpacity onPress={() => setCurrentView('ASTRO')} style={styles.backButton}>
                                <Text style={{ color: theme.accent }}>重新绘制</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {currentView === 'RESULT_IC' && (
                        <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                            <HexagramVisual name={resultData.title} lines={resultData.lines} />
                            <View style={styles.divider} />
                            <Text style={[styles.messageText, { color: theme.text }]}>
                                {resultData.message}
                            </Text>
                            <TouchableOpacity onPress={() => setCurrentView('HOME')} style={styles.backButton}>
                                <Text style={{ color: theme.accent }}>返回首页</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
    header: { padding: 20, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', marginTop: 20 },
    appTitle: { fontSize: 24, letterSpacing: 2 },
    scroll: { padding: 20, paddingBottom: 50 },

    // Menu
    introText: { textAlign: 'center', marginBottom: 30, fontSize: 16, opacity: 0.8 },
    menuCard: { padding: 25, borderRadius: 16, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, fontFamily: 'Cinzel_700Bold' },
    cardDesc: { fontSize: 14, opacity: 0.8 },

    // Forms
    glassCard: { padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
    sectionTitle: { fontSize: 18, marginBottom: 20, fontFamily: 'Cinzel_700Bold' },
    formContainer: { width: '100%' },
    label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, fontFamily: 'Inter_400Regular' },
    calculateButton: { marginTop: 30, height: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#ffcc33', shadowOpacity: 0.3, shadowRadius: 10 },
    calculateButtonText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 },

    // Hexagram
    hexagramContainer: { alignItems: 'center', marginVertical: 20 },
    lineRow: { marginVertical: 4 },
    yangLine: { width: 120, height: 12, backgroundColor: '#ffcc33', borderRadius: 2 },
    yinLineContainer: { flexDirection: 'row', width: 120, justifyContent: 'space-between' },
    yinLinePart: { width: 52, height: 12, backgroundColor: '#ffcc33', borderRadius: 2 },
    yinLineGap: { width: 16 },
    hexName: { marginTop: 20, fontSize: 22, color: '#ffcc33', fontFamily: 'NotoSerifSC_700Bold' },

    // Results
    resultTitle: { fontSize: 24, textAlign: 'center', marginBottom: 10 },
    resultMeta: { fontSize: 12, marginBottom: 20, textAlign: 'center', opacity: 0.7 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 20 },
    messageText: { fontSize: 16, lineHeight: 28, textAlign: 'justify', fontFamily: 'NotoSerifSC_400Regular' },
    backButton: { marginTop: 30, padding: 10 },
    homeBtn: { padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }
});
