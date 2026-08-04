import * as Astronomy from "astronomy-engine";

import { parseDateParts, parseTimeParts } from "./inputValidation";
import { resolveLocation } from "./locations";

const ZODIAC_SIGNS = [
  { name: "白羊座", en: "Aries", ruler: "Mars" },
  { name: "金牛座", en: "Taurus", ruler: "Venus" },
  { name: "双子座", en: "Gemini", ruler: "Mercury" },
  { name: "巨蟹座", en: "Cancer", ruler: "Moon" },
  { name: "狮子座", en: "Leo", ruler: "Sun" },
  { name: "处女座", en: "Virgo", ruler: "Mercury" },
  { name: "天秤座", en: "Libra", ruler: "Venus" },
  { name: "天蝎座", en: "Scorpio", ruler: "Pluto" },
  { name: "射手座", en: "Sagittarius", ruler: "Jupiter" },
  { name: "摩羯座", en: "Capricorn", ruler: "Saturn" },
  { name: "水瓶座", en: "Aquarius", ruler: "Uranus" },
  { name: "双鱼座", en: "Pisces", ruler: "Neptune" },
];

const getZodiacFromLongitude = (longitude) => {
  const normalized = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normalized / 30)];
};

const zonedParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
};

/** Convert a wall-clock time in an IANA zone to a UTC Date, including historical DST. */
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
    throw new Error("该出生时间在所选时区不存在或存在歧义（可能处于夏令时切换）");
  }
  return result;
};

export const getSunSign = (birthDate) => {
  const longitude = Astronomy.SunPosition(Astronomy.MakeTime(birthDate)).elon;
  return getZodiacFromLongitude(longitude);
};

export const getMoonSign = (birthDate) => {
  const longitude = Astronomy.EclipticGeoMoon(Astronomy.MakeTime(birthDate)).lon;
  return getZodiacFromLongitude(longitude);
};

export const getAscendant = (birthDate, latitude, longitude) => {
  const gast = Astronomy.SiderealTime(Astronomy.MakeTime(birthDate));
  const localSiderealDegrees = (((gast + longitude / 15) % 24) + 24) % 24 * 15;
  const obliquity = 23.4392911;
  const theta = localSiderealDegrees * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const epsilon = obliquity * Math.PI / 180;
  let ascendant = Math.atan2(
    Math.cos(theta),
    -(Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)),
  ) * 180 / Math.PI;
  ascendant = ((ascendant % 360) + 360) % 360;
  return getZodiacFromLongitude(ascendant);
};

export const getBigThree = ({ date, time, location }) => {
  const dateParts = parseDateParts(date);
  if (!dateParts) throw new Error("出生日期无效");

  if (!time) {
    const noonUtc = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 12));
    return {
      sun: getSunSign(noonUtc),
      moon: null,
      ascendant: null,
      hasPreciseTime: false,
      location: null,
      birthDateUtc: noonUtc,
    };
  }

  const timeParts = parseTimeParts(time);
  if (!timeParts) throw new Error("出生时间无效");
  const resolved = resolveLocation(location);
  if (!resolved) {
    throw new Error("暂不支持该出生地点；请使用列表中可识别的城市名称");
  }

  const birthDateUtc = localDateTimeToUtc({ ...dateParts, ...timeParts }, resolved.timeZone);
  return {
    sun: getSunSign(birthDateUtc),
    moon: getMoonSign(birthDateUtc),
    ascendant: getAscendant(birthDateUtc, resolved.latitude, resolved.longitude),
    hasPreciseTime: true,
    location: resolved,
    birthDateUtc,
  };
};
