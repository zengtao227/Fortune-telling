/**
 * 西式占星模块 - 使用 astronomy-engine 专业库
 * Best Practice: 基于真实天文计算的太阳/月亮/上升星座
 */

import * as Astronomy from 'astronomy-engine';

import { parseDateParts, parseTimeParts } from './inputValidation';
import { resolveLocation } from './locations';

// 十二星座配置
const ZODIAC_SIGNS = [
    { name: '白羊座', en: 'Aries', element: '火', ruler: '火星' },
    { name: '金牛座', en: 'Taurus', element: '土', ruler: '金星' },
    { name: '双子座', en: 'Gemini', element: '风', ruler: '水星' },
    { name: '巨蟹座', en: 'Cancer', element: '水', ruler: '月亮' },
    { name: '狮子座', en: 'Leo', element: '火', ruler: '太阳' },
    { name: '处女座', en: 'Virgo', element: '土', ruler: '水星' },
    { name: '天秤座', en: 'Libra', element: '风', ruler: '金星' },
    { name: '天蝎座', en: 'Scorpio', element: '水', ruler: '冥王星' },
    { name: '射手座', en: 'Sagittarius', element: '火', ruler: '木星' },
    { name: '摩羯座', en: 'Capricorn', element: '土', ruler: '土星' },
    { name: '水瓶座', en: 'Aquarius', element: '风', ruler: '天王星' },
    { name: '双鱼座', en: 'Pisces', element: '水', ruler: '海王星' }
];

/**
 * 根据黄道经度获取星座
 * @param {number} longitude - 黄道经度 (0-360)
 * @returns {Object} 星座信息
 */
const getZodiacFromLongitude = (longitude) => {
    const normalizedLng = ((longitude % 360) + 360) % 360;
    const index = Math.floor(normalizedLng / 30);
    return ZODIAC_SIGNS[index];
};

const zonedParts = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
};

// 某个 UTC 瞬间在该时区显示的墙上时间，换算回"若把这串数字当UTC"的毫秒数
const shownAsUtcMs = (utcMs, timeZone) => {
    const shown = zonedParts(new Date(utcMs), timeZone);
    return Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second);
};

/**
 * 将某个 IANA 时区下的墙上时间精确换算为 UTC，含历史夏令时规则。
 *
 * 不用 try/catch 猜测夏令时问题，而是直接算出"该时区一天前"和"一天后"
 * 两个安全落在切换窗口之外的 UTC 偏移量，各自反推出一个候选 UTC 瞬间，
 * 再验证哪些候选换算回本地时间后确实等于用户输入：
 *   0 个候选 → 该本地时间在"春季跳空"缺口中不存在
 *   1 个候选 → 正常时间(两个偏移量算出的候选重合)
 *   2 个候选 → 该本地时间在"秋季回拨"发生了两次，存在歧义
 *
 * @returns {{ type: 'unique'|'gap'|'ambiguous', utc: Date }}
 */
export const localDateTimeToUtc = ({ year, month, day, hour, minute }, timeZone) => {
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    const oneDayMs = 24 * 60 * 60 * 1000;

    const offsetBefore = shownAsUtcMs(target - oneDayMs, timeZone) - (target - oneDayMs);
    const offsetAfter = shownAsUtcMs(target + oneDayMs, timeZone) - (target + oneDayMs);

    const verify = (utcMs) => {
        const shown = zonedParts(new Date(utcMs), timeZone);
        return shown.year === year && shown.month === month && shown.day === day &&
            shown.hour === hour && shown.minute === minute;
    };

    const rawCandidates = [target - offsetBefore, target - offsetAfter];
    const candidates = [...new Set(rawCandidates)].filter(verify).sort((a, b) => a - b);

    if (candidates.length === 0) {
        // 跳空：用切换前偏移量反推出的瞬间，天然落在切换幅度之后的第一个有效时刻，
        // 不需要假设固定跳过1小时——切换幅度本身可能不是1小时。
        return { type: 'gap', utc: new Date(target - offsetBefore) };
    }
    if (candidates.length === 1) {
        return { type: 'unique', utc: new Date(candidates[0]) };
    }
    // 回拨歧义：两个候选都合法，取较早的一次(切换前，即当地时间第一次出现该时刻)。
    return { type: 'ambiguous', utc: new Date(candidates[0]) };
};

const resolveBirthUtc = (dateParts, timeParts, timeZone) => {
    const { type, utc } = localDateTimeToUtc({ ...dateParts, ...timeParts }, timeZone);
    return {
        utc,
        timeEstimated: type === 'gap',
        timeAmbiguous: type === 'ambiguous',
    };
};

/**
 * 获取太阳星座 (Sun Sign)
 * @param {Date} birthDate - 出生日期
 * @returns {Object} 太阳星座信息
 */
export const getSunSign = (birthDate) => {
    try {
        const astroDate = Astronomy.MakeTime(birthDate);
        const sunPos = Astronomy.SunPosition(astroDate);
        return getZodiacFromLongitude(sunPos.elon);
    } catch (e) {
        console.warn('Sun sign calculation error:', e);
        return getFallbackSunSign(birthDate);
    }
};

/**
 * 获取月亮星座 (Moon Sign)
 * @param {Date} birthDate - 出生日期时间
 * @returns {Object} 月亮星座信息
 */
export const getMoonSign = (birthDate) => {
    try {
        const astroDate = Astronomy.MakeTime(birthDate);
        const moonPos = Astronomy.EclipticGeoMoon(astroDate);
        return getZodiacFromLongitude(moonPos.lon);
    } catch (e) {
        console.warn('Moon sign calculation error:', e);
        return null;
    }
};

/**
 * 计算上升星座 (Ascendant/Rising Sign)
 * 需要精确的出生时间和地点
 * @param {Date} birthDate - 出生日期时间
 * @param {number} latitude - 出生地纬度
 * @param {number} longitude - 出生地经度
 * @returns {Object} 上升星座信息
 */
export const getAscendant = (birthDate, latitude = 31.23, longitude = 121.47) => {
    try {
        const astroDate = Astronomy.MakeTime(birthDate);
        const gast = Astronomy.SiderealTime(astroDate);
        const lstDegrees = (((gast + longitude / 15) % 24) + 24) % 24 * 15;

        const obliquity = 23.4392911; // IAU 平均黄赤交角常数，精度优于此前硬编码的 23.44
        const obliqRad = obliquity * Math.PI / 180;
        const latRad = latitude * Math.PI / 180;
        const lstRad = lstDegrees * Math.PI / 180;

        const ascRad = Math.atan2(
            Math.cos(lstRad),
            -(Math.sin(lstRad) * Math.cos(obliqRad) + Math.tan(latRad) * Math.sin(obliqRad))
        );

        let ascDegrees = ascRad * 180 / Math.PI;
        if (ascDegrees < 0) ascDegrees += 360;

        return getZodiacFromLongitude(ascDegrees);
    } catch (e) {
        console.warn('Ascendant calculation error:', e);
        return null;
    }
};

// 城市库未识别时的宽容估算基准：上海坐标 + 上海时区
const FALLBACK_LOCATION = { latitude: 31.23, longitude: 121.47, timeZone: 'Asia/Shanghai' };

/**
 * 获取完整的"大三合"星座信息
 * @param {Object} params - 包含 date, time, location
 * @returns {Object} 日月升三合信息
 */
export const getBigThree = ({ date, time, location }) => {
    const dateParts = parseDateParts(date);
    if (!dateParts) throw new Error('出生日期无效');

    if (!time) {
        const noonUtc = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 12));
        return {
            sun: getSunSign(noonUtc),
            moon: null,
            ascendant: null,
            hasPreciseTime: false,
            locationEstimated: false,
            locationProvided: false,
            timeEstimated: false,
            timeAmbiguous: false,
        };
    }

    const timeParts = parseTimeParts(time);
    if (!timeParts) throw new Error('出生时间无效');

    const resolved = resolveLocation(location);
    const locationEstimated = !resolved;
    const target = resolved || FALLBACK_LOCATION;

    const { utc: birthDateUtc, timeEstimated, timeAmbiguous } = resolveBirthUtc(dateParts, timeParts, target.timeZone);

    return {
        sun: getSunSign(birthDateUtc),
        moon: getMoonSign(birthDateUtc),
        ascendant: getAscendant(birthDateUtc, target.latitude, target.longitude),
        hasPreciseTime: true,
        locationEstimated,
        // 未识别地点里，"压根没填"和"填了但认不出"值得在文案上区分
        locationProvided: !!(location && location.trim()),
        timeEstimated,
        timeAmbiguous,
    };
};

/**
 * 回退方案：简单日期判断太阳星座
 */
const getFallbackSunSign = (date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();

    const DATES = [
        [1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 21],
        [7, 23], [8, 23], [9, 23], [10, 23], [11, 22], [12, 22]
    ];

    for (let i = 0; i < 12; i++) {
        const [startMonth, startDay] = DATES[i];
        const nextIdx = (i + 1) % 12;
        const [endMonth, endDay] = DATES[nextIdx];

        if ((m === startMonth && d >= startDay) || (m === endMonth && d < endDay)) {
            return ZODIAC_SIGNS[i];
        }
    }

    return ZODIAC_SIGNS[9]; // 默认摩羯座
};
