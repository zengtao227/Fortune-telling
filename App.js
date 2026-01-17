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

// --- Assets ---
const YIN_YANG_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Yin_yang.svg/1200px-Yin_yang.svg.png'; // Placeholder for Tai Chi

// --- Persistence Helper ---
const STORAGE_KEY = 'mystic_user_data';
const saveUserData = async (data) => {
    try {
        if (isWeb) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Note: AsyncStorage would be used in native, but for web-first verify simple localStorage is enough or mock it
    } catch (e) { console.warn(e); }
};
const loadUserData = async () => {
    try {
        if (isWeb) {
            const item = localStorage.getItem(STORAGE_KEY);
            return item ? JSON.parse(item) : null;
        }
    } catch (e) { return null; }
    return null;
};

// --- Components ---

const StarBackground = () => {
    // Enhanced "Breathing" Stars
    // We create fewer but more distinct stars with faster, more visible pulse
    const stars = useRef(Array.from({ length: 50 }).map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 4 + 2, // Larger stars
        anim: new Animated.Value(Math.random()) // Random start phase
    }))).current;

    useEffect(() => {
        stars.forEach(star => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(star.anim, {
                        toValue: 1,
                        duration: 1500 + Math.random() * 1000, // Faster pulse
                        useNativeDriver: false, // Web compatibility
                    }),
                    Animated.timing(star.anim, {
                        toValue: 0.3, // Don't fade out completely
                        duration: 1500 + Math.random() * 1000,
                        useNativeDriver: false,
                    })
                ])
            ).start();
        });
    }, []);

    return (
        <View style={StyleSheet.absoluteFill}>
            {stars.map(s => (
                <Animated.View
                    key={s.key}
                    style={{
                        position: 'absolute',
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        borderRadius: s.size / 2,
                        backgroundColor: '#FFF',
                        shadowColor: '#FFF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                        opacity: s.anim, // Controlled by animation
                        transform: [{
                            scale: s.anim.interpolate({
                                inputRange: [0.3, 1],
                                outputRange: [0.8, 1.4] // Visible size pulsing
                            })
                        }]
                    }}
                />
            ))}
        </View>
    );
};

const YinYangLoader = () => {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: (t) => t, // Linear spin
                useNativeDriver: false,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Animated.Image
                style={{
                    width: 120,
                    height: 120,
                    transform: [{ rotate: spin }],
                    opacity: 0.9
                }}
                source={{ uri: YIN_YANG_IMG }}
                resizeMode="contain"
            />
            <Text style={{ marginTop: 30, color: '#ffcc33', letterSpacing: 4, fontSize: 16 }}>
                天地感应中...
            </Text>
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
            <View style={styles.hexagramBox}>
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
            </View>
            <Text style={styles.hexName}>{name}</Text>
        </View>
    );
};

const AstrologyForm = ({ onSubmit, theme }) => {
    const [formData, setFormData] = useState({ name: '', date: '', location: '' });

    // Load data on mount
    useEffect(() => {
        loadUserData().then(data => {
            if (data) setFormData(data);
        });
    }, []);

    // Auto-save on change
    useEffect(() => {
        saveUserData(formData);
    }, [formData]);

    const handleDateChange = (text) => {
        // Auto-hyphenation logic
        let formatted = text.replace(/[^0-9]/g, ''); // Remove non-digits
        if (formatted.length > 4) {
            formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
        }
        if (formatted.length > 7) {
            formatted = formatted.slice(0, 7) + '-' + formatted.slice(7);
        }
        if (formatted.length > 10) {
            formatted = formatted.slice(0, 10);
        }
        setFormData(prev => ({ ...prev, date: formatted }));
    };

    return (
        <View style={styles.formContainer}>
            <Text style={[styles.label, { color: theme.secondary }]}>你的名字 (Name)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Mystic Seeker"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={[styles.label, { color: theme.secondary }]}>出生日期 (YYYY-MM-DD)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={formData.date}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                placeholder="2000-01-01"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={[styles.label, { color: theme.secondary }]}>出生地点 (Location)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="Shanghai, China"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <TouchableOpacity
                style={[styles.calculateButton, { backgroundColor: theme.accent }]}
                onPress={() => onSubmit(formData)}
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
    const [isCalculating, setIsCalculating] = useState(false); // For animation

    // Astro Logic
    const handleAstroSubmit = (formData) => {
        if (!formData.date || formData.date.length < 10) {
            alert("请输入完整的日期 YYYY-MM-DD");
            return;
        }

        setIsCalculating(true);
        // Simulate Calculation Time
        setTimeout(() => {
            const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'];
            const hash = (formData.date.length + (formData.location?.length || 0)) % planets.length;
            const planet = planets[hash];
            const planetNameMap = { Sun: '太阳', Moon: '月亮', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星' };
            const msg = resolveAstrologyMessage(planet);

            setResultData({
                title: `命宫主星 · ${planetNameMap[planet]}`,
                message: msg || "星轨流转，你的命运此刻正在上升。",
                extra: `基于 ${formData.date} 在 ${formData.location || '未知领域'} 的星图推演`
            });
            setIsCalculating(false);
            setCurrentView('RESULT_AS');
            if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1500);
    };

    // Iching Logic
    const handleIchingStart = () => {
        setIsCalculating(true);
        setCurrentView('RESULT_IC'); // Navigate first, show loader

        // Simulate Ritual Time
        setTimeout(() => {
            const hexList = ['乾为天', '坤为地', '水雷屯', '山水蒙', '水天需', '泽雷随', '山风蛊', '地泽临', '风地观', '火雷噬嗑', '山火贲', '地雷复', '山天大畜', '山雷颐', '泽风大过', '坎为水', '离为火', '泽山咸', '雷风恒', '天山遁'];
            const randomHex = hexList[Math.floor(Math.random() * hexList.length)];

            const lines = getHexagramLines(randomHex);
            const msg = resolveIChingMessage(randomHex);

            setResultData({
                title: `本卦 · ${randomHex}`,
                message: msg,
                lines: lines || [1, 1, 1, 1, 1, 1]
            });
            setIsCalculating(false); // Reveal result
            if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 2500); // 2.5s ritual
    };

    if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

    return (
        <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
            <StatusBar style="light" />
            <StarBackground />

            <View style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Header: Consistent across all views */}
                    <View style={styles.header}>
                        <Text style={[styles.appTitle, { color: theme.accent, fontFamily: theme.fontTitle }]}>
                            MYSTIC TAROT
                        </Text>
                        {currentView !== 'HOME' && (
                            <TouchableOpacity onPress={() => setCurrentView('HOME')} style={styles.homeBtn}>
                                <Text style={{ color: theme.secondary, fontSize: 12 }}>HOME</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Main Content */}
                    <View style={styles.cardContainer}>

                        {currentView === 'HOME' && (
                            <>
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
                            </>
                        )}

                        {currentView === 'ASTRO' && !isCalculating && (
                            <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                <Text style={[styles.sectionTitle, { color: theme.accent }]}>输入星盘信息</Text>
                                <AstrologyForm onSubmit={handleAstroSubmit} theme={theme} />
                            </View>
                        )}

                        {/* Result Views share loading state logic differently? No, simpler to just show loader if calculating */}

                        {(currentView === 'RESULT_AS' || currentView === 'ASTRO') && isCalculating && (
                            <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                <YinYangLoader />
                            </View>
                        )}

                        {currentView === 'RESULT_AS' && !isCalculating && (
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

                        {currentView === 'RESULT_IC' && isCalculating && (
                            <View style={[styles.glassCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                <YinYangLoader />
                            </View>
                        )}

                        {currentView === 'RESULT_IC' && !isCalculating && (
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

                    </View>

                </ScrollView>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, alignItems: 'center' }, // Centers the content horizontal
    scroll: { flexGrow: 1, width: '100%', alignItems: 'center', paddingBottom: 50 },

    // Main constrained container acting as "Mobile Screen"
    cardContainer: {
        width: '100%',
        maxWidth: 420, // Phone width
        padding: 20,
    },

    header: {
        padding: 20,
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 20
    },
    appTitle: { fontSize: 24, letterSpacing: 2 },
    homeBtn: { padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 12 },

    // Menu
    introText: { textAlign: 'center', marginBottom: 30, fontSize: 16, opacity: 0.8 },
    menuCard: { padding: 25, borderRadius: 16, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
    cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, fontFamily: 'Cinzel_700Bold' },
    cardDesc: { fontSize: 14, opacity: 0.8 },

    // Forms
    glassCard: {
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        width: '100%',
        minHeight: 400, // Min height for consistency
        justifyContent: 'center'
    },
    sectionTitle: { fontSize: 18, marginBottom: 20, fontFamily: 'Cinzel_700Bold' },
    formContainer: { width: '100%' },
    label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, fontFamily: 'Inter_400Regular' },
    calculateButton: { marginTop: 30, height: 55, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#ffcc33', shadowOpacity: 0.3, shadowRadius: 10 },
    calculateButtonText: { color: '#000', fontWeight: 'bold', letterSpacing: 1 },

    // Hexagram
    hexagramContainer: { alignItems: 'center', marginVertical: 10 },
    hexagramBox: { padding: 20, borderWidth: 2, borderColor: 'rgba(255,204,51,0.1)', borderRadius: 10 }, // Frame around hexagram
    lineRow: { marginVertical: 6 },
    yangLine: { width: 140, height: 16, backgroundColor: '#ffcc33', borderRadius: 2, shadowColor: '#ffcc33', shadowRadius: 5, shadowOpacity: 0.5 },
    yinLineContainer: { flexDirection: 'row', width: 140, justifyContent: 'space-between' },
    yinLinePart: { width: 60, height: 16, backgroundColor: '#ffcc33', borderRadius: 2, shadowColor: '#ffcc33', shadowRadius: 5, shadowOpacity: 0.5 },
    yinLineGap: { width: 20 },
    hexName: { marginTop: 25, fontSize: 26, color: '#ffcc33', fontFamily: 'NotoSerifSC_700Bold', letterSpacing: 4 },

    // Results
    resultTitle: { fontSize: 24, textAlign: 'center', marginBottom: 10 },
    resultMeta: { fontSize: 12, marginBottom: 20, textAlign: 'center', opacity: 0.7 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 20 },
    messageText: { fontSize: 17, lineHeight: 30, textAlign: 'justify', fontFamily: 'NotoSerifSC_400Regular' },
    backButton: { marginTop: 30, padding: 10 },
});
