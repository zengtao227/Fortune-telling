
export const TRIGRAMS = {
    "乾": [1, 1, 1], "坤": [0, 0, 0], "震": [1, 0, 0], "巽": [0, 1, 1],
    "坎": [0, 1, 0], "离": [1, 0, 1], "艮": [0, 0, 1], "兑": [1, 1, 0]
};

// Map hexagram names to their upper/lower trigrams for visual rendering
// Lower trigram is first (bottom), Upper is second (top)
// 0 = Broken (Yin), 1 = Solid (Yang)
export const HEXAGRAM_CONFIG = {
    "乾为天": { upper: "乾", lower: "乾" },
    "坤为地": { upper: "坤", lower: "坤" },
    "水雷屯": { upper: "坎", lower: "震" },
    "山水蒙": { upper: "艮", lower: "坎" },
    "水天需": { upper: "坎", lower: "乾" },
    "天水讼": { upper: "乾", lower: "坎" },
    "地水师": { upper: "坤", lower: "坎" },
    "水地比": { upper: "坎", lower: "坤" },
    "风天小畜": { upper: "巽", lower: "乾" },
    "天泽履": { upper: "乾", lower: "兑" },
    "地天泰": { upper: "坤", lower: "乾" },
    "天地否": { upper: "乾", lower: "坤" },
    "天火同人": { upper: "乾", lower: "离" },
    "火天大有": { upper: "离", lower: "乾" },
    "地山谦": { upper: "坤", lower: "艮" },
    "雷地豫": { upper: "震", lower: "坤" },
    "泽雷随": { upper: "兑", lower: "震" },
    "山风蛊": { upper: "艮", lower: "巽" },
    "地泽临": { upper: "坤", lower: "兑" },
    "风地观": { upper: "巽", lower: "坤" },
    "火雷噬嗑": { upper: "离", lower: "震" },
    "山火贲": { upper: "艮", lower: "离" },
    "山地剥": { upper: "艮", lower: "坤" },
    "地雷复": { upper: "坤", lower: "震" },
    "天雷无妄": { upper: "乾", lower: "震" },
    "山天大畜": { upper: "艮", lower: "乾" },
    "山雷颐": { upper: "艮", lower: "震" },
    "泽风大过": { upper: "兑", lower: "巽" },
    "坎为水": { upper: "坎", lower: "坎" },
    "离为火": { upper: "离", lower: "离" },
    "泽山咸": { upper: "兑", lower: "艮" },
    "雷风恒": { upper: "震", lower: "巽" },
    "天山遁": { upper: "乾", lower: "艮" },
    "雷天大壮": { upper: "震", lower: "乾" },
    "火地晋": { upper: "离", lower: "坤" },
    "地火明夷": { upper: "坤", lower: "离" },
    "风火家人": { upper: "巽", lower: "离" },
    "火泽睽": { upper: "离", lower: "兑" },
    "水山蹇": { upper: "坎", lower: "艮" },
    "雷水解": { upper: "震", lower: "坎" },
    "山泽损": { upper: "艮", lower: "兑" },
    "风雷益": { upper: "巽", lower: "震" },
    "泽天夬": { upper: "兑", lower: "乾" },
    "天风姤": { upper: "乾", lower: "巽" },
    "泽地萃": { upper: "兑", lower: "坤" },
    "地风升": { upper: "坤", lower: "巽" },
    "泽水困": { upper: "兑", lower: "坎" },
    "水风井": { upper: "坎", lower: "巽" },
    "泽火革": { upper: "兑", lower: "离" },
    "火风鼎": { upper: "离", lower: "巽" },
    "震为雷": { upper: "震", lower: "震" },
    "艮为山": { upper: "艮", lower: "艮" },
    "风山渐": { upper: "巽", lower: "艮" },
    "雷泽归妹": { upper: "震", lower: "兑" },
    "雷火丰": { upper: "震", lower: "离" },
    "火山旅": { upper: "离", lower: "艮" },
    "巽为风": { upper: "巽", lower: "巽" },
    "泽兑": { upper: "兑", lower: "兑" },
    "风水涣": { upper: "巽", lower: "坎" },
    "水泽节": { upper: "坎", lower: "兑" },
    "风泽中孚": { upper: "巽", lower: "兑" },
    "雷山小过": { upper: "震", lower: "艮" },
    "水火既济": { upper: "坎", lower: "离" },
    "火水未济": { upper: "离", lower: "坎" }
};

export const getHexagramLines = (name) => {
    const config = HEXAGRAM_CONFIG[name];
    if (!config) return null;
    const lower = TRIGRAMS[config.lower]; // [bottom, middle, top] of trigram
    const upper = TRIGRAMS[config.upper];
    // In Yi Jing, lines are read from bottom to top.
    // Stack: Lower Trigram (lines 1,2,3) + Upper Trigram (lines 4,5,6)
    return [...lower, ...upper];
};
