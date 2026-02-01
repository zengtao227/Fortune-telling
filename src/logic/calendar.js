
const JIAN_CHU_NAMES = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"];

const YI_JI_DATA = {
    "建": { yi: "开市 交易 纳财 出行 下聘 拜师 会亲友 祈福", ji: "破屋 坏垣 破土 行丧 安葬 拆卸 掘井 乘船" },
    "除": { yi: "结婚 祈福 出行 沐浴 剃头 求医 治病 破土 坏屋", ji: "开张 搬家 开渠 经商 上任 词讼" },
    "满": { yi: "储藏 祭祀 祈福 宴会 裁衣 安床 交易 置产 上梁修造", ji: "动土 穿井 下葬 破土 栽种 移徙" },
    "平": { yi: "涂泥 修造 入殓 安葬 祭祀 扫舍 治病 坏屋", ji: "祈福 进人口 嫁娶 签约 出行" },
    "定": { yi: "祭祀 冠笄 结婚 移徙 搬家 裁衣 纳采 订盟 出火 拆卸 入宅 作灶 置产 安床", ji: "远行 丧葬 搬迁 词讼 打官司 出行 针灸" },
    "执": { yi: "祭祀 结婚 修造 签名 纳采 捉捕 纳财 拜访 祈福", ji: "开市 搬家 旅游 远行 开仓 掘井" },
    "破": { yi: "求医 拆迁 破屋 治病 坏屋 拆卸 针灸 扫舍", ji: "祈福 会友 嫁娶 开光 签合同 开市 搬家" },
    "危": { yi: "祭祀 祈福 入学 纳采 扫舍 安床 冠笄 沐浴 竖柱", ji: "登山 冒险 动土 针灸 出行" },
    "成": { yi: "结婚 入学 会友 交易 合帐 冠笄 解除 安葬 破土 启钻 移柩 修造 竖柱 牧养", ji: "词讼 诉讼 官司 搬家 打官司" },
    "收": { yi: "祭祀 扫舍 纳采 修坟 合帐 裁衣 开市 交易 纳财 求学 祈福 娶妻 赴任", ji: "出行 安葬 针灸 旅游 搬家 放债" },
    "开": { yi: "祭祀 祈福 结婚 见贵 求职 纳采 订盟 解除 订婚 提亲 开市 交易 竖柱 修造", ji: "安葬 伐木 经商 出火 诉讼 放债" },
    "闭": { yi: "建房 补垣 填坑 祭祀 扫舍 修造 万事不宜 塞穴", ji: "出行 搬家 旅游 安葬 开市 嫁娶" }
};

const ZODIAC_SIGNS = [
    { name: "白羊座", en: "Aries", start: [3, 21], end: [4, 19] },
    { name: "金牛座", en: "Taurus", start: [4, 20], end: [5, 20] },
    { name: "双子座", en: "Gemini", start: [5, 21], end: [6, 21] },
    { name: "巨蟹座", en: "Cancer", start: [6, 22], end: [7, 22] },
    { name: "狮子座", en: "Leo", start: [7, 23], end: [8, 22] },
    { name: "处女座", en: "Virgo", start: [8, 23], end: [9, 22] },
    { name: "天秤座", en: "Libra", start: [9, 23], end: [10, 23] },
    { name: "天蝎座", en: "Scorpio", start: [10, 24], end: [11, 22] },
    { name: "射手座", en: "Sagittarius", start: [11, 23], end: [12, 21] },
    { name: "摩羯座", en: "Capricorn", start: [12, 22], end: [1, 19] },
    { name: "水瓶座", en: "Aquarius", start: [1, 20], end: [2, 18] },
    { name: "双鱼座", en: "Pisces", start: [2, 19], end: [3, 20] }
];

export const getZodiac = (date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    for (const sign of ZODIAC_SIGNS) {
        const [sM, sD] = sign.start;
        const [eM, eD] = sign.end;
        if (m === sM && d >= sD) return sign;
        if (m === eM && d <= eD) return sign;
    }
    return ZODIAC_SIGNS.find(s => s.en === "Capricorn");
};

/**
 * 农历月日算法 (针对 2025-2026 精确偏移)
 */
const getLunarDate = (date) => {
    const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
    const L_MONTHS = ["", "正月", "二月", "三月", "四月", "五月", "六月", "闰六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
    const L_DAYS = ["", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
        "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    // 统一基准：中午12点 UTC+8
    const targetDate = new Date(y, m, d, 12, 0, 0);

    // --- 1. 干支年与生肖 (立春分界，模拟 Health Tracker 逻辑) ---
    let zodiacYear = y;
    if ((m === 0) || (m === 1 && d < 4)) {
        zodiacYear--;
    }
    const yearOffset = zodiacYear - 2024;
    const gzYearIdx = (0 + yearOffset % 10 + 10) % 10;
    const gzZhiIdx = (4 + yearOffset % 12 + 12) % 12;

    // --- 2. 真实农历月日 (2025/2026 精确查表) ---
    // 2025年农历正月初一: 1月29日
    const lunarYearStart = new Date(2025, 0, 29, 12, 0, 0);
    const diffTime = targetDate.getTime() - lunarYearStart.getTime();
    const daysInLunarYear = Math.floor(diffTime / 86400000);

    // 2025年月份偏移表 (包含闰六月，总计384天)
    const monthDays = [0, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30];

    let lunarMonth = 1;
    let lunarDay = 1;
    let remainingDays = daysInLunarYear;

    if (daysInLunarYear >= 0) {
        for (let i = 1; i < monthDays.length; i++) {
            if (remainingDays < monthDays[i]) {
                lunarMonth = i;
                lunarDay = remainingDays + 1;
                break;
            }
            remainingDays -= monthDays[i];
            // 防止溢出到2026年春节后
            if (i === monthDays.length - 1) {
                lunarMonth = 1; // 2026正月
                lunarDay = remainingDays + 1;
            }
        }
    } else {
        // 2025年春节前，回退到2024年腊月处理
        lunarMonth = 13; // 腊月
        lunarDay = 30 + daysInLunarYear + 1;
    }

    const mName = L_MONTHS[lunarMonth] || `${lunarMonth}月`;
    const dName = L_DAYS[lunarDay] || `${lunarDay}日`;

    return `${GAN[gzYearIdx]}${ZHI[gzZhiIdx]}${ANIMALS[gzZhiIdx]}年 · ${mName}${dName}`;
};

export const calculateAlmanac = (date = new Date()) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const targetDate = new Date(y, m, d, 12, 0, 0);

    // 1. 设置对比基准 (2024-02-10 12:00:00 是甲辰年正月初一)
    const refDate = new Date(2024, 1, 10, 12, 0, 0);

    // 2. 计算从基准日期开始的天数偏移
    const diffTime = targetDate.getTime() - refDate.getTime();
    const diffDays = Math.floor(diffTime / 86400000);

    // 3. 计算地支索引 (4 是基准日的地支：辰)
    const branchIndex = (4 + diffDays % 12 + 12) % 12;
    // 4. 计算月令地支索引 (1月是寅=2)
    const monthBranchIndex = (m + 2) % 12;

    // 5. 建除神判定
    const shenIndex = (branchIndex - monthBranchIndex + 12) % 12;
    const shen = JIAN_CHU_NAMES[shenIndex];

    const rawData = YI_JI_DATA[shen] || { yi: "诸事不宜", ji: "诸事不宜" };

    // 6. 应用防碎词技术 (Internal characters bound by \u2060)
    const WJ = "\u2060";
    const format = (text) => text.split(" ").map(word => word.split("").join(WJ)).join(" ");

    const solarStr = `${y}年${m + 1}月${d}日`;
    const lunarStr = getLunarDate(date);

    return {
        solar: solarStr,
        lunar: lunarStr,
        shen,
        yi: format(rawData.yi),
        ji: format(rawData.ji)
    };
};

/**
 * 周易仿真起卦算法 (大衍筮法概率仿真)
 */
export const performDivination = () => {
    const castLine = () => {
        // 模拟三个硬币/蓍草分拨
        // 概率分布: 老阳(3), 少阴(5), 少阳(7), 老阴(1) -> 总和 16
        const rand = Math.floor(Math.random() * 16);
        if (rand < 3) return { val: 9, type: 'yang', moving: true };  // 老阳
        if (rand < 8) return { val: 8, type: 'yin', moving: false };  // 少阴
        if (rand < 15) return { val: 7, type: 'yang', moving: false }; // 少阳
        return { val: 6, type: 'yin', moving: true };                // 老阴
    };

    const lines = [];
    for (let i = 0; i < 6; i++) {
        lines.push(castLine());
    }

    // 本卦 (Original)
    const originalLines = lines.map(l => l.type === 'yang' ? 1 : 0);
    // 变卦 (Change) - 动爻变色
    const changeLines = lines.map(l => {
        if (!l.moving) return l.type === 'yang' ? 1 : 0;
        return l.type === 'yang' ? 0 : 1;
    });

    const hasMovingLines = lines.some(l => l.moving);

    return {
        lines: originalLines, // 用于 UI 基础显示
        raw: lines,           // 包含动爻信息
        changeLines: hasMovingLines ? changeLines : null
    };
};
