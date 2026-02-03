/**
 * 中式历法模块 - 使用 lunar-javascript 专业库
 * Best Practice: 精确到分秒的农历/干支/宜忌推算
 */

import { Solar, Lunar } from 'lunar-javascript';

/**
 * 获取完整黄历信息
 * @param {Date} date - 日期对象
 * @returns {Object} 包含农历、干支、宜忌、神煞等完整信息
 */
export const calculateAlmanac = (date = new Date()) => {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();

    // 值神与黄黑道
    const tianShen = lunar.getDayTianShen();
    const tianShenType = lunar.getDayTianShenType();

    // 宜忌 (库返回数组，需要转换为字符串)
    const yiArray = lunar.getDayYi() || [];
    const jiArray = lunar.getDayJi() || [];

    // 应用防碎词技术 (Internal characters bound by \u2060)
    const WJ = "\u2060";
    const formatPhrases = (arr, limit = 15) => {
        if (!arr || arr.length === 0) return "诸事不宜";
        return arr.slice(0, limit).map(word => word.split("").join(WJ)).join(" ");
    };

    // 吉时参考 (遍历 12 时辰)
    const jiShi = [];
    const times = lunar.getTimes();
    const HOUR_MAP = {
        '子': '23:00-00:59', '丑': '01:00-02:59', '寅': '03:00-04:59',
        '卯': '05:00-06:59', '辰': '07:00-08:59', '巳': '09:00-10:59',
        '午': '11:00-12:59', '未': '13:00-14:59', '申': '15:00-16:59',
        '酉': '17:00-18:59', '戌': '19:00-20:59', '亥': '21:00-22:59'
    };
    times.forEach(t => {
        const zhi = t.getZhi();
        const yi = t.getYi(); // Ensure correct method is used
        if (yi && yi.length > 0 && yi[0] !== '无') {
            jiShi.push(`${zhi}时(${HOUR_MAP[zhi]}) 宜: ${yi.slice(0, 3).join(" ")}`);
        }
    });

    // 冲煞
    const chong = lunar.getDayChongDesc ? lunar.getDayChongDesc() : lunar.getDayChong();
    const sha = lunar.getDaySha();
    const chongSha = `冲${chong}煞${sha}`;

    // 吉神凶煞
    const jiShen = lunar.getDayJiShen() || [];
    const xiongSha = lunar.getDayXiongSha() || [];

    // 二十八星宿
    const xiu = lunar.getXiu();
    const zheng = lunar.getZheng();

    // 胎神方位
    const taiShen = lunar.getDayTaiShen ? lunar.getDayTaiShen() : "";

    // 彭祖百忌
    const pengZuGan = lunar.getPengZuGan();
    const pengZuZhi = lunar.getPengZuZhi();

    // 节气
    const jieQi = lunar.getJieQi();

    // 九星
    const jiuXing = lunar.getDayNineStar ? lunar.getDayNineStar().toString() : "";

    return {
        // 基础信息
        solar: solarStr,
        lunar: lunarStr,
        shen: zhiXing,
        tianShen,
        tianShenType,

        // 宜忌 (格式化后)
        yi: formatPhrases(yiArray, 15),
        ji: formatPhrases(jiArray, 10),

        // 原始宜忌数组 (供高级展示用)
        yiArray,
        jiArray,

        // 吉时
        jiShi: jiShi.join("\n"),

        // 神煞信息
        chongSha,
        jiShen: jiShen.slice(0, 6).join("、") || "无",
        xiongSha: xiongSha.slice(0, 6).join("、") || "无",

        // 星宿
        xiu: `${xiu}宿`,
        zheng,

        // 其他
        taiShen,
        pengZu: `${pengZuGan} ${pengZuZhi}`,
        jieQi: jieQi || "",
        jiuXing
    };
};

/**
 * 获取星座 (保持向后兼容)
 * @param {Date} date - 出生日期
 * @returns {Object} 星座信息
 */
export const getZodiac = (date) => {
    const solar = Solar.fromDate(date);
    const xingZuo = solar.getXingZuo();

    const ZODIAC_EN = {
        '白羊': 'Aries', '金牛': 'Taurus', '双子': 'Gemini', '巨蟹': 'Cancer',
        '狮子': 'Leo', '处女': 'Virgo', '天秤': 'Libra', '天蝎': 'Scorpio',
        '射手': 'Sagittarius', '摩羯': 'Capricorn', '水瓶': 'Aquarius', '双鱼': 'Pisces'
    };

    return {
        name: `${xingZuo}座`,
        en: ZODIAC_EN[xingZuo] || xingZuo
    };
};

/**
 * 周易仿真起卦算法 (大衍筮法概率仿真)
 * Best Practice: 老阳(9) 3/16, 少阴(8) 5/16, 少阳(7) 7/16, 老阴(6) 1/16
 */
export const performDivination = () => {
    const castLine = () => {
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
        lines: originalLines,
        raw: lines,
        changeLines: hasMovingLines ? changeLines : null
    };
};
