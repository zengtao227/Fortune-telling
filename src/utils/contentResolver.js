import corpus from '../../assets/data/corpus.json';

const TIME_SLOTS = {
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    EVENING: 'evening',
    NIGHT: 'night',
};

export const getCurrentTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return TIME_SLOTS.MORNING;
    if (hour >= 11 && hour < 18) return TIME_SLOTS.AFTERNOON;
    if (hour >= 18 && hour < 22) return TIME_SLOTS.EVENING;
    return TIME_SLOTS.NIGHT;
};

export const resolveIChingMessage = (hexagramName) => {
    const slot = getCurrentTimeSlot();
    const hex = corpus.iching.find(h => h.name === hexagramName || h.hexagram === hexagramName);
    if (!hex) {
        const fallbackMessages = {
            morning: "晨曦初照，卦象显现。此卦蕴含天地之理，顺势而为，自有良缘。今日宜静心观察，不宜急躁冒进。",
            afternoon: "日悬中天，卦理昭然。阴阳调和之际，把握当下。午后宜思考规划，沉稳处事。",
            evening: "暮色渐浓，卦意深远。一日将尽，回顾得失。今夜宜放下执念，顺应自然。",
            night: "夜幕低垂，卦象入梦。静谧之中蕴藏转机。安心入眠，明日自有新气象。"
        };
        const fallback = fallbackMessages[slot] || fallbackMessages.morning;
        return fallback.trimStart();
    }
    const messageObj = hex.slots.find(s => s.time === slot) || hex.slots[0];
    return (messageObj && messageObj.message ? messageObj.message : '').trimStart();
};

export const resolveAstrologyMessage = (planetName) => {
    const slot = getCurrentTimeSlot();
    const planet = corpus.astrology[planetName];
    if (!planet) return null;
    const messageObj = planet.find(s => s.time === slot) || planet[0];
    return messageObj.message;
};

export const resolveAlmanacMessage = (type) => {
    const slot = getCurrentTimeSlot();
    const list = corpus.almanac[type];
    if (!list) return null;

    // Filter by time slot
    const timeFiltered = list.filter(item => item.time === slot);
    if (timeFiltered.length > 0) {
        const randomIndex = Math.floor(Math.random() * timeFiltered.length);
        return timeFiltered[randomIndex].message;
    }

    // Fallback to random any
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex].message;
};
