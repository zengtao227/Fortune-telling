import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  Image,
} from "react-native";

import { getBigThree } from "./src/logic/astrology";
import { calculateAlmanac, performDivination } from "./src/logic/calendar";
import { getHexagramLines, findHexagramByLines } from "./src/logic/iching";
import { THEMES, getTheme } from "./src/theme";
import {
  resolveIChingMessage,
  resolveAstrologyMessage,
} from "./src/utils/contentResolver";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

// --- Persistence Helper ---
// Web uses localStorage (sync); native uses AsyncStorage (async) — unified behind one async API.
const canUseWebStorage =
  isWeb && typeof window !== "undefined" && !!window.localStorage;

const storage = {
  async getItem(key) {
    try {
      if (isWeb) return canUseWebStorage ? window.localStorage.getItem(key) : null;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (isWeb) {
        if (canUseWebStorage) window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      // Persistence is best-effort (quota/permissions); safe to ignore.
    }
  },
};

// --- Web CSS Injection ---
const WebStyle = () => {
  if (!isWeb) return null;
  return (
    <View style={{ display: "none" }}>
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
    delay: Math.random() * 3000,
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebStyle />
      {stars.map((s) => (
        <View
          key={s.key}
          // Web-specific class injection for animation
          // React Native Web maps "className" prop to DOM class
          // Note: This relies on RNW passing through extra props or using createElement.
          // To be safe in standard RN, we just use style. But for RNW, we can try style animation or native driver.
          // Given previous failure, we'll try a hybrid approach.
          style={[
            {
              position: "absolute",
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              borderRadius: s.size / 2,
              backgroundColor: "#FFF",
              opacity: 0.8,
              shadowColor: "#FFF",
              shadowRadius: 4,
            },
            // On web, we assign the animation via the injected style tag class
            isWeb && {
              animation: `twinkle ${3 + Math.random()}s infinite ease-in-out ${Math.random() * 2}s`,
            },
          ]}
        />
      ))}
    </View>
  );
};

const AstroLoader = () => {
  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", height: 300 }}
    >
      <View
        style={{
          width: 140,
          height: 140,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Galaxy Arm 1 - Outer Slow */}
        <View
          style={[
            {
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 2,
              borderColor: "transparent",
              borderTopColor: "#ffcc33",
              borderRightColor: "rgba(255,204,51,0.3)",
              shadowColor: "#ffcc33",
              shadowRadius: 10,
              shadowOpacity: 0.5,
            },
            isWeb && { animation: "spin 3s linear infinite" },
          ]}
        />

        {/* Galaxy Arm 2 - Middle Medium */}
        <View
          style={[
            {
              position: "absolute",
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 2,
              borderColor: "transparent",
              borderBottomColor: "#ffcc33",
              borderLeftColor: "rgba(255,204,51,0.3)",
              opacity: 0.8,
            },
            isWeb && { animation: "spin 2s linear infinite reverse" },
          ]}
        />

        {/* Galaxy Arm 3 - Inner Fast */}
        <View
          style={[
            {
              position: "absolute",
              width: 60,
              height: 60,
              borderRadius: 30,
              borderWidth: 2,
              borderColor: "transparent",
              borderTopColor: "#FFF",
              borderLeftColor: "rgba(255,255,255,0.3)",
              opacity: 0.9,
            },
            isWeb && { animation: "spin 1s linear infinite" },
          ]}
        />

        {/* Core Star */}
        <View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#FFF",
              shadowColor: "#FFF",
              shadowRadius: 15,
              shadowOpacity: 1,
            },
            isWeb && { animation: "twinkle 1s infinite ease-in-out" },
          ]}
        />
      </View>
      <Text
        style={{
          marginTop: 30,
          color: "#ffcc33",
          letterSpacing: 4,
          fontSize: 16,
        }}
      >
        星系推演中...
      </Text>
    </View>
  );
};

const YinYangLoader = () => {
  // Pure CSS/View drawn Tai Chi
  return (
    <View
      style={{ alignItems: "center", justifyContent: "center", height: 300 }}
    >
      <View
        style={[
          {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: "#ffcc33",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#FFF",
          },
          isWeb && { animation: "spin 2s linear infinite" }, // CSS Spin
        ]}
      >
        {/* Black Right Side */}
        <View
          style={{
            position: "absolute",
            right: 0,
            width: 50,
            height: 100,
            backgroundColor: "#000",
          }}
        />

        {/* Top Center Circle (Black) */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 25,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#000",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#FFF",
            }}
          />
        </View>

        {/* Bottom Center Circle (White) */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 25,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#FFF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#000",
            }}
          />
        </View>
      </View>
      <Text
        style={{
          marginTop: 30,
          color: "#ffcc33",
          letterSpacing: 4,
          fontSize: 16,
        }}
      >
        天地感应中...
      </Text>
    </View>
  );
};

const HexagramVisual = ({
  name,
  lines,
  rawLines,
  changeName,
  changeLines,
  theme,
}) => {
  const displayLines = [...(rawLines || [])].reverse();
  const displayChangeLines = [...(changeLines || [])].reverse();
  const nameLabel = ((name || "").split(" · ")[1] || name || "").trim();
  const changeLabel = (changeName || "").trim();
  const hasMoving = (rawLines || []).some((l) => l.moving);
  const hasChange = !!changeLabel;

  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* Original Hexagram */}
        <View style={styles.hexagramContainer}>
          <View style={[styles.hexagramBox, { borderColor: theme.border }]}>
            {displayLines.map((l, idx) => (
              <View key={idx} style={styles.lineRow}>
                {l.type === "yang" ? (
                  <View
                    style={[
                      styles.yangLine,
                      l.moving && { backgroundColor: "#ff5722" },
                    ]}
                  />
                ) : (
                  <View style={styles.yinLineContainer}>
                    <View
                      style={[
                        styles.yinLinePart,
                        l.moving && { backgroundColor: "#ff5722" },
                      ]}
                    />
                    <View style={styles.yinLineGap} />
                    <View
                      style={[
                        styles.yinLinePart,
                        l.moving && { backgroundColor: "#ff5722" },
                      ]}
                    />
                  </View>
                )}
                {l.moving && (
                  <View style={styles.movingMarker}>
                    <Text style={styles.movingMarkerText}>
                      {l.val === 9 ? "○" : "✕"}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          <Text style={[styles.hexName, { color: theme.accent }]}>
            {nameLabel}
          </Text>
        </View>

        {/* Arrow if there's a change */}
        {hasChange && (
          <Text
            style={{
              fontSize: 24,
              color: theme.accent,
              marginHorizontal: 12,
              opacity: 0.4,
            }}
          >
            →
          </Text>
        )}

        {/* Change Hexagram */}
        {hasChange && (
          <View style={styles.hexagramContainer}>
            <View
              style={[
                styles.hexagramBox,
                {
                  borderColor: "rgba(255,255,255,0.05)",
                  backgroundColor: "transparent",
                },
              ]}
            >
              {displayChangeLines.map((val, idx) => (
                <View key={idx} style={styles.lineRow}>
                  {val === 1 ? (
                    <View
                      style={[
                        styles.yangLine,
                        {
                          backgroundColor: "rgba(255,204,51,0.9)",
                          shadowOpacity: 0,
                        },
                      ]}
                    />
                  ) : (
                    <View style={styles.yinLineContainer}>
                      <View
                        style={[
                          styles.yinLinePart,
                          {
                            backgroundColor: "rgba(255,204,51,0.9)",
                            shadowOpacity: 0,
                          },
                        ]}
                      />
                      <View style={styles.yinLineGap} />
                      <View
                        style={[
                          styles.yinLinePart,
                          {
                            backgroundColor: "rgba(255,204,51,0.9)",
                            shadowOpacity: 0,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
            <Text
              style={[styles.hexName, { color: theme.secondary, fontSize: 18 }]}
            >
              {changeLabel}
            </Text>
          </View>
        )}
      </View>
      {hasMoving && (
        <View style={styles.movingLegend}>
          <Text style={[styles.movingLegendText, { color: theme.secondary }]}>
            ○ 老阳（动爻） ✕ 老阴（动爻）
          </Text>
        </View>
      )}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 15 }}
      >
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#ff5722",
            marginRight: 6,
          }}
        />
        <Text style={[styles.resultMeta, { marginVertical: 0 }]}>
          {hasChange ? "变爻已现，事物正向对极转化" : "六爻贞静，守持本象之意"}
        </Text>
      </View>
    </View>
  );
};

const AstrologyForm = ({ onSubmit, theme }) => {
  // Initialize state directly from storage if possible, otherwise empty
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  // Load Effect
  useEffect(() => {
    let cancelled = false;
    storage.getItem("astro_saved_data").then((saved) => {
      if (!saved || cancelled) return;
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.date) setDate(data.date);
        if (data.time) setTime(data.time);
        if (data.location) setLocation(data.location);
      } catch (e) {
        // Corrupt saved draft; ignore and keep empty fields.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Save Effect
  useEffect(() => {
    storage.setItem(
      "astro_saved_data",
      JSON.stringify({ name, date, time, location }),
    );
  }, [name, date, time, location]);

  const handleDateChange = (text) => {
    // Strict formatting logic
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;

    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
    }
    if (cleaned.length > 6) {
      formatted = formatted.slice(0, 7) + "-" + cleaned.slice(6);
    }

    // Limit
    if (formatted.length > 10) formatted = formatted.slice(0, 10);

    setDate(formatted);
  };

  const handleTimeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + ":" + cleaned.slice(2);
    }
    if (formatted.length > 5) formatted = formatted.slice(0, 5);
    setTime(formatted);
  };

  return (
    <View style={styles.formContainer}>
      <Text style={[styles.label, { color: theme.secondary }]}>
        你的名字 (Name)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: "rgba(0,0,0,0.2)",
            fontFamily: theme.fontBody,
          },
        ]}
        value={name}
        onChangeText={setName}
        placeholder="Mystic Seeker"
        placeholderTextColor={theme.placeholder}
      />

      <Text style={[styles.label, { color: theme.secondary }]}>
        出生日期 (YYYY-MM-DD)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: "rgba(0,0,0,0.2)",
            fontFamily: theme.fontBody,
          },
        ]}
        value={date}
        onChangeText={handleDateChange}
        keyboardType="numeric"
        maxLength={10}
        placeholder="2000-01-01"
        placeholderTextColor={theme.placeholder}
      />

      <Text style={[styles.label, { color: theme.secondary }]}>
        出生时间 (HH:mm)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: "rgba(0,0,0,0.2)",
            fontFamily: theme.fontBody,
          },
        ]}
        value={time}
        onChangeText={handleTimeChange}
        keyboardType="numeric"
        maxLength={5}
        placeholder="13:30"
        placeholderTextColor={theme.placeholder}
      />

      <Text style={[styles.label, { color: theme.secondary }]}>
        出生地点 (Location)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: "rgba(0,0,0,0.2)",
            fontFamily: theme.fontBody,
          },
        ]}
        value={location}
        onChangeText={setLocation}
        placeholder="Shanghai, China"
        placeholderTextColor={theme.placeholder}
      />

      <TouchableOpacity
        style={[
          styles.calculateButton,
          { backgroundColor: theme.accent, shadowColor: theme.accent },
        ]}
        onPress={() => onSubmit({ name, date, time, location })}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.calculateButtonText, { color: theme.onAccent }]}>
            绘制星盘
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: theme.onAccent,
              opacity: 0.5,
              letterSpacing: 1.5,
              marginTop: 2,
              fontWeight: "bold",
            }}
          >
            CHART GENERATOR
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorScreen}>
          <Text style={styles.errorTitle}>星轨暂时紊乱</Text>
          <Text style={styles.errorHint}>请重新打开应用</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [fontsLoaded] = Font.useFonts({
    Cinzel_700Bold: require("@expo-google-fonts/cinzel/700Bold/Cinzel_700Bold.ttf"),
    NotoSerifSC_400Regular: require("@expo-google-fonts/noto-serif-sc/400Regular/NotoSerifSC_400Regular.ttf"),
  });

  const [themeMode, setThemeMode] = useState(THEMES.TAROT);
  const theme = getTheme(themeMode);

  // Views: 'HOME', 'ICHING', 'ASTRO', 'RESULT_IC', 'RESULT_AS'
  const [currentView, setCurrentView] = useState("HOME");
  const [resultData, setResultData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false); // For animation

  const [todayAlmanac, setTodayAlmanac] = useState(() => {
    try {
      return calculateAlmanac(new Date());
    } catch (e) {
      console.error("Initial Almanac Error:", e);
      return { solar: "公元2025年", lunar: "读取中...", yi: "宜事天成", ji: "诸事谨慎", shen: "吉" };
    }
  });

  const balancePhrases = (text) => {
    if (!text) return "";
    // Content already has \u2060 separators. We split by spaces.
    const words = text.split(" ").filter((w) => w.length > 0);
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
        location: formData.location,
      });

      // Map Zodiac to nearest planet in our corpus for messages
      const zodiacToPlanetMap = {
        Aries: "Mars",
        Taurus: "Venus",
        Gemini: "Mercury",
        Cancer: "Moon",
        Leo: "Sun",
        Virgo: "Mercury",
        Libra: "Venus",
        Scorpio: "Mars",
        Sagittarius: "Jupiter",
        Capricorn: "Jupiter",
        Aquarius: "Mercury",
        Pisces: "Jupiter",
      };

      const planet = zodiacToPlanetMap[bigThree.sun?.en] || "Sun";
      const msg = resolveAstrologyMessage(planet);
      const sunText = bigThree.sun?.en || "Unknown";
      const moonText =
        bigThree.moon?.en || (bigThree.hasPreciseTime ? "Unknown" : "—");
      const risingText =
        bigThree.ascendant?.en || (bigThree.hasPreciseTime ? "Unknown" : "—");
      const timeTag = formData.time ? ` ${formData.time}` : "";

      setResultData({
        title: `出生星宫 · ${bigThree.sun?.name || "未知"}`,
        bigThree: `🌞 Sun: ${sunText} | 🌙 Moon: ${moonText} | 🏹 Rising: ${risingText}`,
        hasPreciseTime: bigThree.hasPreciseTime,
        locationEstimated: bigThree.locationEstimated,
        message: msg || "星轨流转，你的命运此刻正在上升。",
        extra: `基于 ${formData.date}${timeTag} 的黄道刻度推演`,
      });
      setIsCalculating(false);
      setCurrentView("RESULT_AS");
      if (!isWeb)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  // Iching Logic
  const handleIchingStart = () => {
    setIsCalculating(true);
    setCurrentView("RESULT_IC");

    setTimeout(() => {
      const result = performDivination();
      const originalName = findHexagramByLines(result.lines);
      const changeName = result.changeLines
        ? findHexagramByLines(result.changeLines)
        : null;

      const originalMsg = resolveIChingMessage(originalName);
      const changeMsg = changeName ? resolveIChingMessage(changeName) : "";

      setResultData({
        title: `本卦 · ${originalName}`,
        changeTitle: changeName ? `之卦 · ${changeName}` : null,
        message: originalMsg,
        changeMessage: changeMsg,
        lines: result.lines,
        rawLines: result.raw, // For detailed rendering of moving lines
        changeLines: result.changeLines,
      });
      setIsCalculating(false);
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 2000); // 2s "Ritual"
  };

  const originalHexName = resultData?.title
    ? (resultData.title.split(" · ")[1] || resultData.title).trim()
    : "";
  const changeHexName = resultData?.changeTitle
    ? (resultData.changeTitle.split(" · ")[1] || resultData.changeTitle).trim()
    : "";

  return (
    <LinearGradient
      colors={theme.backgroundGradient}
      style={styles.container}
    >
      <StatusBar style={theme.statusBarStyle} />
      <StarBackground />

      <View style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header: Consistent across all views */}
          <View style={styles.header}>
            <Text
              style={[
                styles.appTitle,
                { color: theme.accent, fontFamily: fontsLoaded ? theme.fontTitle : (Platform.OS === 'web' ? 'serif' : undefined) },
              ]}
            >
              MYSTIC TAROT
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() =>
                  setThemeMode(
                    themeMode === THEMES.TAROT ? THEMES.ZEN : THEMES.TAROT,
                  )
                }
                style={[
                  styles.homeBtn,
                  {
                    borderColor: theme.border,
                    marginRight: currentView !== "HOME" ? 8 : 0,
                  },
                ]}
              >
                <Text style={{ color: theme.secondary, fontSize: 12 }}>
                  {themeMode === THEMES.TAROT ? "☀ 素色" : "☾ 神秘"}
                </Text>
              </TouchableOpacity>
              {currentView !== "HOME" && (
                <TouchableOpacity
                  onPress={() => setCurrentView("HOME")}
                  style={[styles.homeBtn, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.secondary, fontSize: 12 }}>
                    HOME
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.cardContainer}>
            {currentView === "HOME" && (
              <>
                {/* Almanac Card */}
                <View
                  style={[
                    styles.almanacCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Text
                    style={[styles.almanacTitle, { color: theme.accent }]}
                  >
                    今日黄历
                  </Text>
                  <Text style={[styles.dateInfoText, { color: theme.text }]}>
                    {todayAlmanac.solar}
                  </Text>
                  <Text
                    style={[styles.lunarInfoText, { color: theme.secondary }]}
                  >
                    {todayAlmanac.lunar} [{todayAlmanac.shen}日]
                  </Text>

                  {todayAlmanac.tianShen && (
                    <Text
                      style={[
                        styles.almanacMetaText,
                        { color: theme.accent, fontWeight: "bold" },
                      ]}
                    >
                      {todayAlmanac.tianShen} [{todayAlmanac.tianShenType || "吉"}]
                    </Text>
                  )}

                  <Text
                    style={[styles.almanacMetaText, { color: theme.text }]}
                  >
                    星宿: {todayAlmanac.xiu} · 冲煞: {todayAlmanac.chongSha}
                  </Text>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={styles.yiJiRow}>
                    <View style={styles.yiJiCol}>
                      <Text
                        style={[
                          styles.yiJiLabel,
                          { backgroundColor: "#2e7d32" },
                        ]}
                      >
                        宜
                      </Text>
                      <Text style={[styles.yiJiText, { color: theme.text }]}>
                        {balancePhrases(todayAlmanac.yi)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.verticalDivider,
                        { backgroundColor: theme.border },
                      ]}
                    />
                    <View style={styles.yiJiCol}>
                      <Text
                        style={[
                          styles.yiJiLabel,
                          { backgroundColor: "#b71c1c" },
                        ]}
                      >
                        忌
                      </Text>
                      <Text style={[styles.yiJiText, { color: theme.text }]}>
                        {balancePhrases(todayAlmanac.ji)}
                      </Text>
                    </View>
                  </View>

                  {todayAlmanac.jiShi && (
                    <>
                      <View
                        style={[
                          styles.divider,
                          { marginVertical: 15, backgroundColor: theme.border },
                        ]}
                      />
                      <Text
                        style={[
                          styles.almanacTitle,
                          {
                            color: theme.secondary,
                            fontSize: 11,
                            marginBottom: 8,
                          },
                        ]}
                      >
                        吉时参考
                      </Text>
                      <Text style={[styles.jiShiText, { color: theme.text }]}>
                        {todayAlmanac.jiShi}
                      </Text>
                    </>
                  )}
                </View>

                <Text style={[styles.introText, { color: theme.text }]}>
                  选择你的探寻之路
                </Text>
                <TouchableOpacity
                  style={[
                    styles.menuCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onPress={() => setCurrentView("ASTRO")}
                >
                  <Text style={[styles.cardTitle, { color: theme.accent }]}>
                    西洋占星 (Astrology)
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.secondary }]}>
                    绘制出生星盘，探寻行星指引
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                  onLongPress={handleIchingStart}
                  delayLongPress={1000}
                >
                  <Text style={[styles.cardTitle, { color: theme.accent }]}>
                    周易起卦 (I Ching)
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.secondary }]}>
                    六十四卦象，参悟变易之道
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.accent,
                      marginTop: 10,
                      opacity: 0.6,
                    }}
                  >
                    · 长按触发仪式 ·
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {currentView === "ASTRO" && !isCalculating && (
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>
                  输入星盘信息
                </Text>
                <AstrologyForm onSubmit={handleAstroSubmit} theme={theme} />
              </View>
            )}

            {/* Result Views share loading state logic differently? No, simpler to just show loader if calculating */}

            {(currentView === "RESULT_AS" || currentView === "ASTRO") &&
              isCalculating && (
                <View
                  style={[
                    styles.glassCard,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <AstroLoader />
                </View>
              )}

            {currentView === "RESULT_AS" && !isCalculating && (
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resultTitle,
                    { color: theme.accent, fontFamily: theme.fontTitle },
                  ]}
                >
                  {resultData.title}
                </Text>
                <Text style={[styles.resultMeta, { color: theme.secondary }]}>
                  {resultData.extra}
                </Text>
                <Text style={[styles.resultMeta, { color: theme.text }]}>
                  {resultData.bigThree}
                </Text>
                {!resultData.hasPreciseTime && (
                  <Text
                    style={[styles.resultMeta, { color: theme.secondary }]}
                  >
                    未提供出生时间，月亮与上升以默认值显示
                  </Text>
                )}
                {resultData.locationEstimated && (
                  <Text
                    style={[styles.resultMeta, { color: theme.secondary }]}
                  >
                    未识别出生地点，上升星座已用默认坐标(上海)估算
                  </Text>
                )}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Text style={[styles.messageText, { color: theme.text }]}>
                  {resultData.message}
                </Text>
                <TouchableOpacity
                  onPress={() => setCurrentView("ASTRO")}
                  style={styles.backButton}
                >
                  <Text style={{ color: theme.accent }}>重新绘制</Text>
                </TouchableOpacity>
              </View>
            )}

            {currentView === "RESULT_IC" && isCalculating && (
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <YinYangLoader />
              </View>
            )}

            {currentView === "RESULT_IC" && !isCalculating && (
              <View
                style={[
                  styles.glassCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <HexagramVisual
                  name={resultData.title}
                  lines={resultData.lines}
                  rawLines={resultData.rawLines}
                  changeName={
                    resultData.changeTitle && resultData.changeTitle.includes(" · ")
                      ? resultData.changeTitle.split(" · ")[1]
                      : null
                  }
                  changeLines={resultData.changeLines}
                  theme={theme}
                />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.messageBlock}>
                  <Text style={[styles.resultLabel, { color: theme.accent }]}>
                    {originalHexName}：
                  </Text>
                  <Text style={[styles.messageText, { color: theme.text }]}>
                    {(resultData.message || "").trim()}
                  </Text>
                </View>
                {resultData.changeTitle && (
                  <View style={[styles.messageBlock, { marginTop: 15 }]}>
                    <Text style={[styles.resultLabel, { color: "#ff5722" }]}>
                      {changeHexName}：
                    </Text>
                    <Text style={[styles.messageText, { color: theme.text }]}>
                      {(resultData.changeMessage || "").trim()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setCurrentView("HOME")}
                  style={styles.backButton}
                >
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f051d",
    padding: 30,
  },
  errorTitle: {
    color: "#e9d5ff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorHint: { color: "#b388ff", fontSize: 14 },
  safeArea: { flex: 1, alignItems: "center" }, // Centers the content horizontal
  scroll: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    paddingBottom: 50,
  },

  // Main constrained container acting as "Mobile Screen"
  cardContainer: {
    width: "100%",
    maxWidth: 420, // Phone width
    padding: 20,
  },

  header: {
    padding: 20,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginTop: 20,
  },
  appTitle: { fontSize: 24, letterSpacing: 2 },
  homeBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
  },

  // Menu
  introText: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.8,
  },
  menuCard: {
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "Cinzel_700Bold",
  },
  cardDesc: { fontSize: 14, opacity: 0.8 },

  // Forms
  glassCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    minHeight: 400, // Min height for consistency
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 20,
    fontFamily: "Cinzel_700Bold",
  },
  formContainer: { width: "100%" },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  calculateButton: {
    marginTop: 30,
    height: 55,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ffcc33",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  calculateButtonText: { fontWeight: "bold", letterSpacing: 1 },

  // Hexagram
  hexagramContainer: {
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  hexagramBox: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  lineRow: {
    marginVertical: 4,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  yangLine: {
    width: 100,
    height: 12,
    backgroundColor: "#ffcc33",
    borderRadius: 2,
    shadowColor: "#ffcc33",
    shadowRadius: 4,
    shadowOpacity: 0.4,
  },
  yinLineContainer: {
    flexDirection: "row",
    width: 100,
    justifyContent: "space-between",
  },
  yinLinePart: {
    width: 44,
    height: 12,
    backgroundColor: "#ffcc33",
    borderRadius: 2,
    shadowColor: "#ffcc33",
    shadowRadius: 4,
    shadowOpacity: 0.4,
  },
  yinLineGap: { width: 12 },
  movingMarker: { position: "absolute", right: -16, top: -2 },
  movingMarkerText: { color: "#ff5722", fontSize: 16, fontWeight: "bold" },
  hexName: {
    marginTop: 15,
    fontSize: 18,
    color: "#ffcc33",
    fontFamily: "NotoSerifSC_400Regular",
    letterSpacing: 2,
    fontWeight: "700",
    textAlign: "center",
  },
  movingLegend: { marginTop: 10, width: "100%", alignItems: "center" },
  movingLegendText: { fontSize: 12, letterSpacing: 1 },

  // Results
  resultTitle: { fontSize: 24, textAlign: "center", marginBottom: 10 },
  resultMeta: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
    opacity: 1.0,
    color: "#ffcc33",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
    marginVertical: 20,
  },
  messageBlock: { width: "100%" },
  resultLabel: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "left",
    width: "100%",
    marginBottom: 6,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 30,
    textAlign: "left",
    fontFamily: "NotoSerifSC_400Regular",
  },
  backButton: { marginTop: 30, padding: 10 },

  // Almanac Styles
  almanacCard: {
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 25,
    width: "100%",
    alignItems: "center",
  },
  almanacTitle: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.6,
  },
  dateInfoText: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "Cinzel_700Bold",
  },
  lunarInfoText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  almanacMetaText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 6,
    opacity: 0.9,
  },
  yiJiRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
  },
  yiJiCol: { flex: 1, alignItems: "center" },
  yiJiLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    textAlign: "center",
  },
  yiJiText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  jiShiText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
    fontFamily: "NotoSerifSC_400Regular",
  },
  verticalDivider: {
    width: 1,
    height: "80%",
    marginHorizontal: 5,
    opacity: 0.3,
  },
});
