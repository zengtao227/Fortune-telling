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
    if (!hex) return null;
    const messageObj = hex.slots.find(s => s.time === slot) || hex.slots[0];
    return messageObj.message;
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
