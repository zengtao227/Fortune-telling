/**
 * 西式占星模块 - 使用 astronomy-engine 专业库
 * Best Practice: 基于真实天文计算的太阳/月亮/上升星座
 */

import * as Astronomy from 'astronomy-engine';

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
    // 确保经度在 0-360 范围内
    const normalizedLng = ((longitude % 360) + 360) % 360;
    const index = Math.floor(normalizedLng / 30);
    return ZODIAC_SIGNS[index];
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
        const longitude = sunPos.elon;
        return getZodiacFromLongitude(longitude);
    } catch (e) {
        console.warn('Sun sign calculation error:', e);
        // 回退到简单日期判断
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
        const longitude = moonPos.lon;
        return getZodiacFromLongitude(longitude);
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

        // 计算恒星时 (Sidereal Time)
        const gast = Astronomy.SiderealTime(astroDate);

        // 本地恒星时 (Local Sidereal Time)
        const lst = (gast + longitude / 15) % 24;
        const lstDegrees = lst * 15;

        // 计算黄赤交角 (Obliquity of the Ecliptic) - 约23.44度
        const obliquity = 23.44;
        const obliqRad = obliquity * Math.PI / 180;
        const latRad = latitude * Math.PI / 180;
        const lstRad = lstDegrees * Math.PI / 180;

        // 上升点计算公式
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

/**
 * 获取完整的"大三合"星座信息
 * @param {Object} params - 包含 date, time, location
 * @returns {Object} 日月升三合信息
 */
export const getBigThree = (params) => {
    const { date, time, location } = params;

    // 解析日期时间
    const birthDate = new Date(date);
    if (time && time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number);
        birthDate.setHours(hours, minutes, 0, 0);
    }

    // 解析位置 (默认上海)
    let lat = 31.23, lng = 121.47;
    let locationMatched = false;
    if (location) {
        // 简单的城市经纬度映射
        const CITY_COORDS = {
            '北京': [39.90, 116.40],
            '上海': [31.23, 121.47],
            '广州': [23.13, 113.26],
            '深圳': [22.54, 114.06],
            '杭州': [30.29, 120.15],
            '成都': [30.67, 104.07],
            '南京': [32.06, 118.80],
            '武汉': [30.58, 114.27],
            '西安': [34.27, 108.95],
            '重庆': [29.56, 106.55],
            'Beijing': [39.90, 116.40],
            'Shanghai': [31.23, 121.47],
            'New York': [40.71, -74.01],
            'London': [51.51, -0.13],
            'Tokyo': [35.68, 139.69],
            'Paris': [48.86, 2.35]
        };

        for (const [city, coords] of Object.entries(CITY_COORDS)) {
            if (location.includes(city)) {
                [lat, lng] = coords;
                locationMatched = true;
                break;
            }
        }
    }

    // 计算三合
    const sunSign = getSunSign(birthDate);
    const moonSign = time ? getMoonSign(birthDate) : null;
    const ascendant = time ? getAscendant(birthDate, lat, lng) : null;

    return {
        sun: sunSign,
        moon: moonSign,
        ascendant: ascendant,
        hasPreciseTime: !!time,
        // 上升星座依赖出生地经纬度；地点未填或未匹配到城市库时，ascendant 是用默认坐标(上海)估算的
        locationEstimated: !!time && !locationMatched
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
