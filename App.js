import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppState,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { getBigThree } from "./src/logic/astrology";
import { calculateAlmanac, performDivination } from "./src/logic/calendar";
import { validateAstrologyInput } from "./src/logic/inputValidation";
import { findHexagramByLines } from "./src/logic/iching";
import { THEMES, getTheme } from "./src/theme";
import { resolveAstrologyMessage, resolveIChingMessage } from "./src/utils/contentResolver";

const STORAGE_KEY = "astrology_form_v2";
const isWeb = Platform.OS === "web";

const storage = {
  async getItem(key) {
    try {
      if (isWeb) return window.localStorage?.getItem(key) || null;
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      if (isWeb) window.localStorage?.setItem(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch {
      // Local persistence is optional.
    }
  },
  async removeItem(key) {
    try {
      if (isWeb) window.localStorage?.removeItem(key);
      else await AsyncStorage.removeItem(key);
    } catch {
      // Local persistence is optional.
    }
  },
};

const notify = (message) => {
  if (isWeb && typeof window !== "undefined") window.alert(message);
  else Alert.alert("提示", message);
};

const Button = ({ label, onPress, theme, hint, secondary = false }) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityHint={hint}
    onPress={onPress}
    style={[
      styles.button,
      {
        backgroundColor: secondary ? "transparent" : theme.accent,
        borderColor: theme.accent,
      },
    ]}
  >
    <Text style={{ color: secondary ? theme.accent : theme.onAccent, fontWeight: "700" }}>{label}</Text>
  </TouchableOpacity>
);

const AstrologyForm = ({ theme, onSubmit }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    let active = true;
    storage.getItem(STORAGE_KEY).then((raw) => {
      if (!active || !raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.remember) {
          setDate(saved.date || "");
          setTime(saved.time || "");
          setLocation(saved.location || "");
          setRemember(true);
        }
      } catch {
        storage.removeItem(STORAGE_KEY);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (remember) storage.setItem(STORAGE_KEY, JSON.stringify({ date, time, location, remember: true }));
    else storage.removeItem(STORAGE_KEY);
  }, [date, time, location, remember]);

  const submit = () => {
    const check = validateAstrologyInput({ date, time, location });
    if (!check.ok) return notify(check.error);
    onSubmit({ date, time, location });
  };

  const clear = async () => {
    setDate("");
    setTime("");
    setLocation("");
    setRemember(false);
    await storage.removeItem(STORAGE_KEY);
    notify("本机保存的出生资料已清除");
  };

  return (
    <View style={{ width: "100%" }}>
      <Text style={[styles.label, { color: theme.secondary }]}>出生日期（YYYY-MM-DD）</Text>
      <TextInput
        accessibilityLabel="出生日期"
        value={date}
        onChangeText={setDate}
        placeholder="2000-01-01"
        placeholderTextColor={theme.placeholder}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
      />
      <Text style={[styles.label, { color: theme.secondary }]}>出生时间（可选，HH:mm）</Text>
      <TextInput
        accessibilityLabel="出生时间"
        value={time}
        onChangeText={setTime}
        placeholder="13:30"
        placeholderTextColor={theme.placeholder}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
      />
      <Text style={[styles.label, { color: theme.secondary }]}>出生地点</Text>
      <TextInput
        accessibilityLabel="出生地点"
        value={location}
        onChangeText={setLocation}
        placeholder="例如：北京、Basel、New York"
        placeholderTextColor={theme.placeholder}
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
      />
      <Text style={[styles.help, { color: theme.secondary }]}>地点完全在本机匹配；不联网、不调用定位服务。未填写时间时只计算太阳星座。</Text>
      <View style={styles.switchRow}>
        <Text style={{ color: theme.text, flex: 1 }}>在本机记住这些资料</Text>
        <Switch accessibilityLabel="在本机记住出生资料" value={remember} onValueChange={setRemember} />
      </View>
      <Button label="计算日月升" onPress={submit} theme={theme} hint="使用本机离线天文算法计算" />
      <Button label="清除本机资料" onPress={clear} theme={theme} secondary />
    </View>
  );
};

const AppInner = () => {
  const { width, height } = useWindowDimensions();
  const [themeMode, setThemeMode] = useState(THEMES.TAROT);
  const theme = getTheme(themeMode);
  const [view, setView] = useState("HOME");
  const [result, setResult] = useState(null);
  const [almanac, setAlmanac] = useState(() => calculateAlmanac(new Date()));

  const stars = useMemo(() => Array.from({ length: 38 }, (_, index) => ({
    key: index,
    left: ((index * 47) % 97) / 100 * width,
    top: ((index * 73) % 89) / 100 * height,
    size: 1 + (index % 3),
  })), [width, height]);

  useEffect(() => {
    const refresh = () => setAlmanac(calculateAlmanac(new Date()));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const timer = setInterval(refresh, 60 * 1000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  const calculateAstrology = (form) => {
    try {
      const data = getBigThree(form);
      const message = resolveAstrologyMessage(data.sun?.ruler || "Sun") || "把结果当作自我反思的起点，而不是确定性的预言。";
      setResult({ type: "ASTRO", ...data, message, input: form });
      setView("RESULT");
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      notify(error instanceof Error ? error.message : "计算失败，请检查输入");
    }
  };

  const castIChing = () => {
    const cast = performDivination();
    const originalName = findHexagramByLines(cast.lines);
    const changeName = cast.changeLines ? findHexagramByLines(cast.changeLines) : null;
    setResult({
      type: "ICHING",
      originalName,
      changeName,
      raw: cast.raw,
      message: resolveIChingMessage(originalName),
      changeMessage: changeName ? resolveIChingMessage(changeName) : null,
    });
    setView("RESULT");
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <LinearGradient colors={theme.backgroundGradient} style={styles.container}>
      <StatusBar style={theme.statusBarStyle} />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {stars.map((star) => <View key={star.key} style={{ position: "absolute", left: star.left, top: star.top, width: star.size, height: star.size, borderRadius: star.size, backgroundColor: theme.text, opacity: 0.35 }} />)}
      </View>
      <SafeAreaView style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.accent }]}>MYSTIC COMPASS</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="切换主题" onPress={() => setThemeMode(themeMode === THEMES.TAROT ? THEMES.ZEN : THEMES.TAROT)} style={[styles.smallButton, { borderColor: theme.border }]}>
              <Text style={{ color: theme.secondary }}>{themeMode === THEMES.TAROT ? "素色" : "神秘"}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {view === "HOME" && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>今日黄历</Text>
                <Text style={[styles.center, { color: theme.text }]}>{almanac.solar}</Text>
                <Text style={[styles.center, { color: theme.secondary }]}>{almanac.lunar}</Text>
                <Text style={[styles.center, { color: theme.text, marginTop: 12 }]}>宜：{almanac.yi}</Text>
                <Text style={[styles.center, { color: theme.text, marginTop: 8 }]}>忌：{almanac.ji}</Text>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Button label="日月升简析" onPress={() => setView("ASTRO")} theme={theme} hint="输入出生资料进行离线计算" />
                <Button label="周易起卦" onPress={castIChing} theme={theme} hint="点击生成六爻卦象" />
                <Text style={[styles.disclaimer, { color: theme.secondary }]}>本应用完全离线，不含广告、统计或账号系统。内容仅供传统文化娱乐与自我反思，不替代医疗、法律、财务或其他专业建议。</Text>
              </>
            )}
            {view === "ASTRO" && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>出生资料</Text>
                <AstrologyForm theme={theme} onSubmit={calculateAstrology} />
                <Button label="返回首页" onPress={() => setView("HOME")} theme={theme} secondary />
              </>
            )}
            {view === "RESULT" && result?.type === "ASTRO" && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>日月升简析</Text>
                <Text style={[styles.result, { color: theme.text }]}>太阳：{result.sun?.name}</Text>
                <Text style={[styles.result, { color: theme.text }]}>月亮：{result.moon?.name || "未计算"}</Text>
                <Text style={[styles.result, { color: theme.text }]}>上升：{result.ascendant?.name || "未计算"}</Text>
                {result.location && <Text style={[styles.help, { color: theme.secondary }]}>出生地：{result.location.names[0]} · {result.location.timeZone}</Text>}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Text style={[styles.message, { color: theme.text }]}>{result.message}</Text>
                <Button label="重新计算" onPress={() => setView("ASTRO")} theme={theme} />
                <Button label="返回首页" onPress={() => setView("HOME")} theme={theme} secondary />
              </>
            )}
            {view === "RESULT" && result?.type === "ICHING" && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.accent }]}>本卦：{result.originalName}</Text>
                <Text style={[styles.message, { color: theme.text }]}>{result.message}</Text>
                {result.changeName && <><View style={[styles.divider, { backgroundColor: theme.border }]} /><Text style={[styles.sectionTitle, { color: theme.accent }]}>之卦：{result.changeName}</Text><Text style={[styles.message, { color: theme.text }]}>{result.changeMessage}</Text></>}
                <Text style={[styles.disclaimer, { color: theme.secondary }]}>这是基于传统概率模型的娱乐性起卦，不构成确定性预测。</Text>
                <Button label="再起一卦" onPress={castIChing} theme={theme} />
                <Button label="返回首页" onPress={() => setView("HOME")} theme={theme} secondary />
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { console.error("Application error", error, info); }
  render() {
    if (this.state.failed) return <SafeAreaView style={styles.error}><Text style={styles.errorTitle}>应用暂时无法显示</Text><Text style={styles.errorText}>请关闭后重新打开；如持续发生，请在 GitHub 报告问题。</Text></SafeAreaView>;
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center", padding: 18, paddingBottom: 48 },
  header: { width: "100%", maxWidth: 520, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: 1.5 },
  smallButton: { minWidth: 48, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10 },
  card: { width: "100%", maxWidth: 520, borderWidth: 1, borderRadius: 22, padding: 22 },
  sectionTitle: { fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  center: { textAlign: "center", lineHeight: 24 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 16 },
  help: { fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: "center" },
  switchRow: { minHeight: 52, flexDirection: "row", alignItems: "center", marginTop: 10 },
  button: { minHeight: 48, borderWidth: 1, borderRadius: 24, alignItems: "center", justifyContent: "center", marginTop: 14, paddingHorizontal: 18 },
  divider: { height: 1, width: "100%", marginVertical: 20 },
  disclaimer: { fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 18 },
  result: { fontSize: 17, textAlign: "center", marginVertical: 5 },
  message: { fontSize: 16, lineHeight: 28, textAlign: "left" },
  error: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f051d", padding: 28 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 10 },
  errorText: { color: "#ddd", textAlign: "center", lineHeight: 22 },
});
