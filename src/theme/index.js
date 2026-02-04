export const THEMES = {
  TAROT: "tarot",
  ZEN: "zen",
};

export const tarotTheme = {
  background: "#0f051d",
  backgroundGradient: ["#1a0b2e", "#120826", "#0f051d", "#080312", "#05020a"],
  surface: "rgba(30, 20, 50, 0.7)",
  cardGradient: ["rgba(60, 40, 100, 0.4)", "rgba(30, 20, 50, 0.6)"],
  text: "#e9d5ff",
  accent: "#ffcc33",
  secondary: "#b388ff",
  border: "rgba(255, 204, 51, 0.3)",
  fontTitle: "Cinzel_700Bold",
  fontBody: "NotoSerifSC_400Regular",
  shadow: {
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const zenTheme = {
  background: "#fdfcf0",
  backgroundGradient: ["#fdfcf0", "#f5f5f5", "#e8e8e8"],
  surface: "rgba(255, 255, 255, 0.8)",
  cardGradient: ["rgba(255, 255, 255, 0.9)", "rgba(240, 240, 240, 0.7)"],
  text: "#2d3436",
  accent: "#4a4a4a",
  secondary: "#8e8e8e",
  border: "rgba(0, 0, 0, 0.05)",
  fontTitle: "NotoSerifSC_400Regular",
  fontBody: "NotoSerifSC_400Regular",
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
};

export const getTheme = (mode) => (mode === THEMES.ZEN ? zenTheme : tarotTheme);
