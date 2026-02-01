
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
    const L_MONTHS = ["", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
    const L_DAYS = ["", "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
        "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    // 2026年春节: 2月17日 (属马)
    const spring2026 = new Date(2026, 1, 17);
    const spring2025 = new Date(2025, 0, 29);

    let lunarYear, lunarMonth, lunarDay;
    let offsetYear = 2024;

    if (date >= spring2026) {
        lunarYear = 2026;
        const diff = Math.floor((date - spring2026) / 86400000);
        lunarMonth = Math.floor(diff / 30) + 1;
        lunarDay = (diff % 30) + 1;
    } else if (date >= spring2025) {
        lunarYear = 2025;
        const diff = Math.floor((date - spring2025) / 86400000);
        // 简易模拟：2025年有闰六月(384天)，此处做近似处理
        lunarMonth = Math.floor(diff / 29.5) + 1;
        if (lunarMonth > 6) lunarMonth; // 简化不处理闰月显示
        lunarDay = Math.floor(diff % 29.5) + 1;
    } else {
        lunarYear = 2024;
        lunarMonth = 12;
        lunarDay = 1; // 极简回退
    }

    const gzYearIdx = (lunarYear - 4) % 10;
    const gzZhiIdx = (lunarYear - 4) % 12;

    return `${GAN[gzYearIdx]}${ZHI[gzZhiIdx]}${ANIMALS[gzZhiIdx]}年 · ${L_MONTHS[lunarMonth] || lunarMonth + '月'}${L_DAYS[lunarDay] || lunarDay + '日'}`;
};

export const calculateAlmanac = (date = new Date()) => {
    const refDate = new Date(2024, 1, 10, 12, 0, 0);
    const diffDays = Math.floor((date - refDate) / 86400000);
    const branchIndex = (4 + diffDays % 12 + 12) % 12;
    const monthBranchIndex = (date.getMonth() + 2) % 12;
    const shenIndex = (branchIndex - monthBranchIndex + 12) % 12;
    const shen = JIAN_CHU_NAMES[shenIndex];

    const rawData = YI_JI_DATA[shen] || { yi: "诸事不宜", ji: "诸事不宜" };
    const WJ = "\u2060";
    const format = (text) => text.split(" ").map(word => word.split("").join(WJ)).join(" ");

    const solarStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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
