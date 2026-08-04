/**
 * Chinese almanac and I Ching calculation. All calculations are local.
 */
import { Solar } from "lunar-javascript";

export const calculateAlmanac = (date = new Date()) => {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const yiArray = lunar.getDayYi() || [];
  const jiArray = lunar.getDayJi() || [];
  const WJ = "\u2060";
  const formatPhrases = (items, limit) => {
    if (!items.length) return "无明确记载";
    return items.slice(0, limit).map((word) => word.split("").join(WJ)).join(" ");
  };

  const HOUR_MAP = {
    子: "23:00–00:59", 丑: "01:00–02:59", 寅: "03:00–04:59", 卯: "05:00–06:59",
    辰: "07:00–08:59", 巳: "09:00–10:59", 午: "11:00–12:59", 未: "13:00–14:59",
    申: "15:00–16:59", 酉: "17:00–18:59", 戌: "19:00–20:59", 亥: "21:00–22:59",
  };
  const auspiciousHours = (lunar.getTimes() || []).filter((item) => {
    if (typeof item.getTianShenLuck !== "function") return false;
    return item.getTianShenLuck() === "吉";
  }).map((item) => {
    const zhi = item.getZhi();
    const suitable = (item.getYi() || []).slice(0, 3).join("、");
    return `${zhi}时 ${HOUR_MAP[zhi]}${suitable ? `：${suitable}` : ""}`;
  });

  const chong = typeof lunar.getDayChongDesc === "function" ? lunar.getDayChongDesc() : lunar.getDayChong();
  const sha = lunar.getDaySha();
  const xiu = lunar.getXiu();

  return {
    solar: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`,
    lunar: `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年 · ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    shen: lunar.getZhiXing() || "",
    tianShen: lunar.getDayTianShen() || "",
    tianShenType: lunar.getDayTianShenType() || "",
    yi: formatPhrases(yiArray, 15),
    ji: formatPhrases(jiArray, 10),
    yiArray,
    jiArray,
    jiShi: auspiciousHours.join("\n"),
    chongSha: `冲${chong || "未知"}煞${sha || "未知"}`,
    xiu: xiu ? `${xiu}宿` : "未知宿",
  };
};

export const performDivination = () => {
  const castLine = () => {
    const random = Math.floor(Math.random() * 16);
    if (random < 3) return { val: 9, type: "yang", moving: true };
    if (random < 8) return { val: 8, type: "yin", moving: false };
    if (random < 15) return { val: 7, type: "yang", moving: false };
    return { val: 6, type: "yin", moving: true };
  };
  const raw = Array.from({ length: 6 }, castLine);
  const lines = raw.map((line) => (line.type === "yang" ? 1 : 0));
  const changed = raw.map((line) => {
    const original = line.type === "yang" ? 1 : 0;
    return line.moving ? 1 - original : original;
  });
  return { lines, raw, changeLines: raw.some((line) => line.moving) ? changed : null };
};
