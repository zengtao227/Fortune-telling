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

/**
 * 将某个 IANA 时区下的墙上时间精确换算为 UTC，含历史夏令时规则。
 * 若该本地时刻落在"春季跳空"缺口(该时区当天不存在该时刻)，会抛出异常，
 * 由调用方 resolveBirthUtc 顺延处理，这里保持"不存在就报错"的精确语义。
 */
export const localDateTimeToUtc = ({ year, month, day, hour, minute }, timeZone) => {
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    let guess = target;
    for (let i = 0; i < 4; i += 1) {
        const shown = zonedParts(new Date(guess), timeZone);
        const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second);
        const correction = target - shownAsUtc;
        if (correction === 0) break;
        guess += correction;
    }
    const result = new Date(guess);
    const verify = zonedParts(result, timeZone);
    if (
        verify.year !== year || verify.month !== month || verify.day !== day ||
        verify.hour !== hour || verify.minute !== minute
    ) {
        throw new Error('该出生时间在所选时区不存在（可能处于夏令时切换）');
    }
    return result;
};

/**
 * 出生时刻若落在春季跳空缺口，顺延1小时取最近的有效本地时刻，
 * 并标记 timeEstimated，而不是让用户看到报错——地点/时间识别失败时
 * 始终给出一个尽力估算的结果，而非拒绝。
 */
const resolveBirthUtc = (dateParts, timeParts, timeZone) => {
    try {
        return { utc: localDateTimeToUtc({ ...dateParts, ...timeParts }, timeZone), timeEstimated: false };
    } catch (e) {
        const nudgedTotalMinutes = timeParts.hour * 60 + timeParts.minute + 60;
        const nudgedTimeParts = {
            hour: Math.floor(nudgedTotalMinutes / 60) % 24,
            minute: nudgedTotalMinutes % 60,
        };
        return { utc: localDateTimeToUtc({ ...dateParts, ...nudgedTimeParts }, timeZone), timeEstimated: true };
    }
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
            timeEstimated: false,
        };
    }

    const timeParts = parseTimeParts(time);
    if (!timeParts) throw new Error('出生时间无效');

    const resolved = resolveLocation(location);
    const locationEstimated = !resolved;
    const target = resolved || FALLBACK_LOCATION;

    const { utc: birthDateUtc, timeEstimated } = resolveBirthUtc(dateParts, timeParts, target.timeZone);

    return {
        sun: getSunSign(birthDateUtc),
        moon: getMoonSign(birthDateUtc),
        ascendant: getAscendant(birthDateUtc, target.latitude, target.longitude),
        hasPreciseTime: true,
        locationEstimated,
        timeEstimated,
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
