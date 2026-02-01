
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
    // Handle Capricorn year wrap
    return ZODIAC_SIGNS.find(s => s.en === "Capricorn");
};

/**
 * 核心算法：建除十二神推算 (基于 2024-02-10 锚点)
 */
export const calculateAlmanac = (date = new Date()) => {
    // 1. 设置对比基准 (2024-02-10 12:00:00 是甲辰年正月初一)
    const refDate = new Date(2024, 1, 10, 12, 0, 0); 
    
    // 2. 计算从基准日期开始的天数偏移
    const diffTime = date.getTime() - refDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 3. 计算地支索引 (4 是基准日的地支：辰)
    const branchIndex = (4 + diffDays % 12 + 12) % 12;
    // 4. 计算月令地支索引 (1月是寅=2)
    const monthBranchIndex = (date.getMonth() + 2) % 12;
    
    // 5. 建除神判定
    const shenIndex = (branchIndex - monthBranchIndex + 12) % 12;
    const shen = JIAN_CHU_NAMES[shenIndex];
    
    const rawData = YI_JI_DATA[shen] || { yi: "诸事不宜", ji: "诸事不宜" };
    
    // 6. 应用防碎词技术 (Anti-breaking)
    const WJ = "\u2060"; 
    const format = (text) => text.split(" ").map(word => word.split("").join(WJ)).join(" ");

    return {
        shen,
        yi: format(rawData.yi),
        ji: format(rawData.ji)
    };
};
