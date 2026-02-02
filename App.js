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
import { getHexagramLines, findHexagramByLines } from './src/logic/iching';
import { calculateAlmanac, performDivination } from './src/logic/calendar';
import { getBigThree } from './src/logic/astrology';

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

// --- Web CSS Injection ---
const WebStyle = () => {
    if (!isWeb) return null;
    return (
        <View style={{ display: 'none' }}>
            <style>{`
                @keyframes twinkle {
                    0% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0.3; transform: scale(0.8); }
                }
                .star-anim {
                    animation: twinkle 3s infinite ease-in-out;
                }
                @keyframes spin { 
                    from { transform: rotate(0deg); } 
                    to { transform: rotate(360deg); } 
                }
                .taichi-spin {
                    animation: spin 2s linear infinite;
                }
            `}</style>
        </View>
    );
};

// --- Components ---

const StarBackground = () => {
    // CSS-based stars for Web reliability, Animated for Native
    const stars = Array.from({ length: 50 }).map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 3 + 2,
        delay: Math.random() * 3000
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            <WebStyle />
            {stars.map(s => (
                <View
                    key={s.key}
                    // Web-specific class injection for animation
                    // React Native Web maps "className" prop to DOM class
                    // Note: This relies on RNW passing through extra props or using createElement. 
                    // To be safe in standard RN, we just use style. But for RNW, we can try style animation or native driver.
                    // Given previous failure, we'll try a hybrid approach.
                    style={[
                        {
                            position: 'absolute',
                            left: s.left,
                            top: s.top,
                            width: s.size,
                            height: s.size,
                            borderRadius: s.size / 2,
                            backgroundColor: '#FFF',
                            opacity: 0.8,
                            shadowColor: '#FFF',
                            shadowRadius: 4,
                        },
                        // On web, we assign the animation via the injected style tag class
                        isWeb && { animation: `twinkle ${3 + Math.random()}s infinite ease-in-out ${Math.random() * 2}s` }
                    ]}
                />
            ))}
        </View>
    );
};

const AstroLoader = () => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
                {/* Galaxy Arm 1 - Outer Slow */}
                <View style={[
                    {
                        position: 'absolute', width: 140, height: 140, borderRadius: 70,
                        borderWidth: 2, borderColor: 'transparent', borderTopColor: '#ffcc33', borderRightColor: 'rgba(255,204,51,0.3)',
                        shadowColor: '#ffcc33', shadowRadius: 10, shadowOpacity: 0.5
                    },
                    isWeb && { animation: 'spin 3s linear infinite' }
                ]} />

                {/* Galaxy Arm 2 - Middle Medium */}
                <View style={[
                    {
                        position: 'absolute', width: 100, height: 100, borderRadius: 50,
                        borderWidth: 2, borderColor: 'transparent', borderBottomColor: '#ffcc33', borderLeftColor: 'rgba(255,204,51,0.3)',
                        opacity: 0.8
                    },
                    isWeb && { animation: 'spin 2s linear infinite reverse' }
                ]} />

                {/* Galaxy Arm 3 - Inner Fast */}
                <View style={[
                    {
                        position: 'absolute', width: 60, height: 60, borderRadius: 30,
                        borderWidth: 2, borderColor: 'transparent', borderTopColor: '#FFF', borderLeftColor: 'rgba(255,255,255,0.3)',
                        opacity: 0.9
                    },
                    isWeb && { animation: 'spin 1s linear infinite' }
                ]} />

                {/* Core Star */}
                <View style={[
                    { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', shadowColor: '#FFF', shadowRadius: 15, shadowOpacity: 1 },
                    isWeb && { animation: 'twinkle 1s infinite ease-in-out' }
                ]} />
            </View>
            <Text style={{ marginTop: 30, color: '#ffcc33', letterSpacing: 4, fontSize: 16 }}>
                星系推演中...
            </Text>
        </View>
    );
};

const YinYangLoader = () => {
    // Pure CSS/View drawn Tai Chi
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <View style={[
                { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#ffcc33', overflow: 'hidden', position: 'relative', backgroundColor: '#FFF' },
                isWeb && { animation: 'spin 2s linear infinite' } // CSS Spin
            ]}>
                {/* Black Right Side */}
                <View style={{ position: 'absolute', right: 0, width: 50, height: 100, backgroundColor: '#000' }} />

                {/* Top Center Circle (Black) */}
                <View style={{ position: 'absolute', top: 0, left: 25, width: 50, height: 50, borderRadius: 25, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF' }} />
                </View>

                {/* Bottom Center Circle (White) */}
                <View style={{ position: 'absolute', bottom: 0, left: 25, width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#000' }} />
                </View>
            </View>
            <Text style={{ marginTop: 30, color: '#ffcc33', letterSpacing: 4, fontSize: 16 }}>
                天地感应中...
            </Text>
        </View>
    );
};

const HexagramVisual = ({ name, lines, rawLines, changeName, changeLines }) => {
    // lines: array of 0/1. Bottom up logic.
    // rawLines: array of {val, type, moving}.
    const displayLines = [...(rawLines || [])].reverse();
    const displayChangeLines = [...(changeLines || [])].reverse();

    return (
        <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {/* Original Hexagram */}
                <View style={styles.hexagramContainer}>
                    <View style={styles.hexagramBox}>
                        {displayLines.map((l, idx) => (
                            <View key={idx} style={styles.lineRow}>
                                {l.type === 'yang' ? (
                                    <View style={[styles.yangLine, l.moving && { backgroundColor: '#ff5722' }]} />
                                ) : (
                                    <View style={styles.yinLineContainer}>
                                        <View style={[styles.yinLinePart, l.moving && { backgroundColor: '#ff5722' }]} />
                                        <View style={styles.yinLineGap} />
                                        <View style={[styles.yinLinePart, l.moving && { backgroundColor: '#ff5722' }]} />
                                    </View>
                                )}
                                {l.moving && (
                                    <Text style={{ position: 'absolute', right: -25, color: '#ff5722', fontWeight: 'bold' }}>
                                        {l.val === 9 ? '◯' : '✕'}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                    <Text style={styles.hexName}>{name.split(' · ')[1] || name}</Text>
                </View>

                {/* Arrow if there's a change */}
                {changeName && (
                    <Text style={{ fontSize: 30, color: '#ffcc33', marginHorizontal: 15 }}>→</Text>
                )}

                {/* Change Hexagram */}
                {changeName && (
                    <View style={styles.hexagramContainer}>
                        <View style={styles.hexagramBox}>
                            {displayChangeLines.map((val, idx) => (
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
                        <Text style={styles.hexName}>{changeName}</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.resultMeta, { marginTop: 10 }]}>
                {changeName ? "动爻已发，物极必反" : "六爻安静，持守本心"}
            </Text>
        </View>
    );
};

const AstrologyForm = ({ onSubmit, theme }) => {
    // Initialize state directly from storage if possible, otherwise empty
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');

    // Load Effect
    useEffect(() => {
        if (isWeb) {
            const saved = localStorage.getItem('astro_saved_data');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.name) setName(data.name);
                    if (data.date) setDate(data.date);
                    if (data.time) setTime(data.time);
                    if (data.location) setLocation(data.location);
                } catch (e) { }
            }
        }
    }, []);

    // Save Effect
    useEffect(() => {
        if (isWeb) {
            localStorage.setItem('astro_saved_data', JSON.stringify({ name, date, time, location }));
        }
    }, [name, date, time, location]);

    const handleDateChange = (text) => {
        // Strict formatting logic
        let cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;

        if (cleaned.length > 4) {
            formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        }
        if (cleaned.length > 6) {
            formatted = formatted.slice(0, 7) + '-' + cleaned.slice(6);
        }

        // Limit
        if (formatted.length > 10) formatted = formatted.slice(0, 10);

        setDate(formatted);
    };

    const handleTimeChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + ':' + cleaned.slice(2);
        }
        if (formatted.length > 5) formatted = formatted.slice(0, 5);
        setTime(formatted);
    };

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
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
                placeholder="2000-01-01"
                placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Text style={[styles.label, { color: theme.secondary }]}>出生时间 (HH:mm)</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: 'rgba(0,0,0,0.2)' }]}
                value={time}
                onChangeText={handleTimeChange}
                keyboardType="numeric"
                maxLength={5}
                placeholder="13:30"
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
                onPress={() => onSubmit({ name, date, time, location })}
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

    const [todayAlmanac] = useState(calculateAlmanac(new Date()));

    const balancePhrases = (text) => {
        if (!text) return "";
        // Content already has \u2060 separators. We split by spaces.
        const words = text.split(" ").filter(w => w.length > 0);
        if (words.length >= 4) {
            const mid = Math.ceil(words.length / 2);
            return words.slice(0, mid).join(" ") + "\n" + words.slice(mid).join(" ");
        }
        return text;
    };

    // Astro Logic
    const handleAstroSubmit = (formData) => {
        if (!formData.date || formData.date.length < 10) {
            alert("请输入完整的日期 YYYY-MM-DD");
            return;
        }

        setIsCalculating(true);
        // Scientific Calculation
        setTimeout(() => {
            const bigThree = getBigThree({
                date: formData.date,
                time: formData.time,
                location: formData.location
            });

            // Map Zodiac to nearest planet in our corpus for messages
            const zodiacToPlanetMap = {
                'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
                'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
                'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
                'Capricorn': 'Jupiter', 'Aquarius': 'Mercury', 'Pisces': 'Jupiter'
            };

            const planet = zodiacToPlanetMap[bigThree.sun?.en] || 'Sun';
            const msg = resolveAstrologyMessage(planet);
            const sunText = bigThree.sun?.en || 'Unknown';
            const moonText = bigThree.moon?.en || (bigThree.hasPreciseTime ? 'Unknown' : '—');
            const risingText = bigThree.ascendant?.en || (bigThree.hasPreciseTime ? 'Unknown' : '—');
            const timeTag = formData.time ? ` ${formData.time}` : '';

            setResultData({
                title: `出生星宫 · ${bigThree.sun?.name || '未知'}`,
                bigThree: `🌞 Sun: ${sunText} | 🌙 Moon: ${moonText} | 🏹 Rising: ${risingText}`,
                hasPreciseTime: bigThree.hasPreciseTime,
                message: msg || "星轨流转，你的命运此刻正在上升。",
                extra: `基于 ${formData.date}${timeTag} 的黄道刻度推演`
            });
            setIsCalculating(false);
            setCurrentView('RESULT_AS');
            if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1500);
    };

    // Iching Logic
    const handleIchingStart = () => {
        setIsCalculating(true);
        setCurrentView('RESULT_IC');

        setTimeout(() => {
            const result = performDivination();
            const originalName = findHexagramByLines(result.lines);
            const changeName = result.changeLines ? findHexagramByLines(result.changeLines) : null;

            const originalMsg = resolveIChingMessage(originalName);
            const changeMsg = changeName ? resolveIChingMessage(changeName) : "";

            setResultData({
                title: `本卦 · ${originalName}`,
                changeTitle: changeName ? `之卦 · ${changeName}` : null,
                message: originalMsg,
                changeMessage: changeMsg,
                lines: result.lines,
                rawLines: result.raw, // For detailed rendering of moving lines
                changeLines: result.changeLines
            });
            setIsCalculating(false);
            if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 2000); // 2s "Ritual"
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
                                {/* Almanac Card */}
                                <View style={[styles.almanacCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                                    <Text style={[styles.almanacTitle, { color: theme.accent }]}>今日黄历</Text>
                                    <Text style={[styles.dateInfoText, { color: theme.text }]}>{todayAlmanac.solar}</Text>
                                    <Text style={[styles.lunarInfoText, { color: theme.secondary }]}>
                                        {todayAlmanac.lunar} [{todayAlmanac.shen}日]
                                    </Text>
                                    <Text style={[styles.almanacMetaText, { color: theme.text }]}>
                                        干支年: {todayAlmanac.lunar.split('年')[0]}年
                                    </Text>
                                    <Text style={[styles.almanacMetaText, { color: theme.secondary }]}>
                                        星宿: {todayAlmanac.xiu} · 冲煞: {todayAlmanac.chongSha}
                                    </Text>

                                    <View style={styles.divider} />

                                    <View style={styles.yiJiRow}>
                                        <View style={styles.yiJiCol}>
                                            <Text style={[styles.yiJiLabel, { backgroundColor: '#4caf50' }]}>宜</Text>
                                            <Text style={[styles.yiJiText, { color: theme.text }]}>
                                                {balancePhrases(todayAlmanac.yi)}
                                            </Text>
                                        </View>
                                        <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
                                        <View style={styles.yiJiCol}>
                                            <Text style={[styles.yiJiLabel, { backgroundColor: '#f44336' }]}>忌</Text>
                                            <Text style={[styles.yiJiText, { color: theme.text }]}>
                                                {balancePhrases(todayAlmanac.ji)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

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
                                    onLongPress={handleIchingStart}
                                    delayLongPress={1500}
                                >
                                    <Text style={[styles.cardTitle, { color: theme.accent }]}>周易起卦 (I Ching)</Text>
                                    <Text style={[styles.cardDesc, { color: theme.secondary }]}>六十四卦象，参悟变易之道</Text>
                                    <Text style={{ fontSize: 10, color: theme.accent, marginTop: 10, opacity: 0.8 }}>(长按3秒以起卦)</Text>
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
                                <AstroLoader />
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
                                <Text style={[styles.resultMeta, { color: theme.text }]}>
                                    {resultData.bigThree}
                                </Text>
                                {!resultData.hasPreciseTime && (
                                    <Text style={[styles.resultMeta, { color: theme.secondary }]}>
                                        未提供出生时间，月亮与上升以默认值显示
                                    </Text>
                                )}
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
                                <HexagramVisual
                                    name={resultData.title}
                                    lines={resultData.lines}
                                    rawLines={resultData.rawLines}
                                    changeName={resultData.changeTitle ? resultData.changeTitle.split(' · ')[1] : null}
                                    changeLines={resultData.changeLines}
                                />
                                <View style={styles.divider} />
                                <Text style={[styles.messageText, { color: theme.text }]}>
                                    <Text style={{ fontWeight: 'bold', color: theme.accent }}>{resultData.title.split(' · ')[1]}: </Text>
                                    {resultData.message}
                                </Text>
                                {resultData.changeTitle && (
                                    <Text style={[styles.messageText, { color: theme.text, marginTop: 15 }]}>
                                        <Text style={{ fontWeight: 'bold', color: '#ff5722' }}>{resultData.changeTitle.split(' · ')[1]}: </Text>
                                        {resultData.changeMessage}
                                    </Text>
                                )}
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
    resultMeta: { fontSize: 12, marginBottom: 20, textAlign: 'center', opacity: 1.0, color: '#ffcc33' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 20 },
    messageText: { fontSize: 17, lineHeight: 30, textAlign: 'justify', fontFamily: 'NotoSerifSC_400Regular' },
    backButton: { marginTop: 30, padding: 10 },

    // Almanac Styles
    almanacCard: { padding: 25, borderRadius: 24, borderWidth: 1, marginBottom: 25, width: '100%', alignItems: 'center' },
    almanacTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12, textAlign: 'center', opacity: 0.6 },
    dateInfoText: { fontSize: 20, textAlign: 'center', marginBottom: 4, fontFamily: 'Cinzel_700Bold' },
    lunarInfoText: { fontSize: 16, textAlign: 'center', marginBottom: 20, opacity: 0.8 },
    almanacMetaText: { fontSize: 12, textAlign: 'center', marginBottom: 6, opacity: 0.9 },
    yiJiRow: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 10 },
    yiJiCol: { flex: 1, alignItems: 'center' },
    yiJiLabel: {
        fontSize: 14, fontWeight: 'bold', color: '#fff',
        paddingHorizontal: 15, paddingVertical: 4,
        borderRadius: 20, overflow: 'hidden', marginBottom: 12,
        textAlign: 'center'
    },
    yiJiText: { fontSize: 14, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
    verticalDivider: { width: 1, height: '80%', marginHorizontal: 5, opacity: 0.3 },
});
