export const LOCATIONS = [
  { id: "beijing", names: ["北京", "Beijing"], latitude: 39.9042, longitude: 116.4074, timeZone: "Asia/Shanghai" },
  { id: "shanghai", names: ["上海", "Shanghai"], latitude: 31.2304, longitude: 121.4737, timeZone: "Asia/Shanghai" },
  { id: "guangzhou", names: ["广州", "Guangzhou"], latitude: 23.1291, longitude: 113.2644, timeZone: "Asia/Shanghai" },
  { id: "shenzhen", names: ["深圳", "Shenzhen"], latitude: 22.5431, longitude: 114.0579, timeZone: "Asia/Shanghai" },
  { id: "hangzhou", names: ["杭州", "Hangzhou"], latitude: 30.2741, longitude: 120.1551, timeZone: "Asia/Shanghai" },
  { id: "chengdu", names: ["成都", "Chengdu"], latitude: 30.5728, longitude: 104.0668, timeZone: "Asia/Shanghai" },
  { id: "nanjing", names: ["南京", "Nanjing"], latitude: 32.0603, longitude: 118.7969, timeZone: "Asia/Shanghai" },
  { id: "wuhan", names: ["武汉", "Wuhan"], latitude: 30.5928, longitude: 114.3055, timeZone: "Asia/Shanghai" },
  { id: "xian", names: ["西安", "Xi'an", "Xian"], latitude: 34.3416, longitude: 108.9398, timeZone: "Asia/Shanghai" },
  { id: "chongqing", names: ["重庆", "Chongqing"], latitude: 29.563, longitude: 106.5516, timeZone: "Asia/Shanghai" },
  { id: "hong-kong", names: ["香港", "Hong Kong"], latitude: 22.3193, longitude: 114.1694, timeZone: "Asia/Hong_Kong" },
  { id: "taipei", names: ["台北", "Taipei"], latitude: 25.033, longitude: 121.5654, timeZone: "Asia/Taipei" },
  { id: "tokyo", names: ["东京", "Tokyo"], latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  { id: "singapore", names: ["新加坡", "Singapore"], latitude: 1.3521, longitude: 103.8198, timeZone: "Asia/Singapore" },
  { id: "zurich", names: ["苏黎世", "Zurich", "Zürich"], latitude: 47.3769, longitude: 8.5417, timeZone: "Europe/Zurich" },
  { id: "basel", names: ["巴塞尔", "Basel"], latitude: 47.5596, longitude: 7.5886, timeZone: "Europe/Zurich" },
  { id: "london", names: ["伦敦", "London"], latitude: 51.5074, longitude: -0.1278, timeZone: "Europe/London" },
  { id: "paris", names: ["巴黎", "Paris"], latitude: 48.8566, longitude: 2.3522, timeZone: "Europe/Paris" },
  { id: "new-york", names: ["纽约", "New York"], latitude: 40.7128, longitude: -74.006, timeZone: "America/New_York" },
  { id: "los-angeles", names: ["洛杉矶", "Los Angeles"], latitude: 34.0522, longitude: -118.2437, timeZone: "America/Los_Angeles" },
  { id: "sydney", names: ["悉尼", "Sydney"], latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
];

const normalize = (value) => (value || "").trim().toLocaleLowerCase();

const isCjk = (value) => /[㐀-鿿豈-﫿]/.test(value);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// CJK 别名保留子串匹配，兼容"北京市朝阳区"这类带后缀的地址输入；
// 拉丁字母别名改用单词边界匹配，避免 "Xianyang" 被误认成 "Xian" 的子串。
// 注意：同名不同地（如 "Paris, Texas" 撞上 "Paris" 法国）不在此修复范围——
// 这是简单名称匹配的固有局限，真正解决需要地区消歧或城市选择器 UI。
const matchesName = (needle, rawName) => {
  const name = normalize(rawName);
  if (!name) return false;
  if (isCjk(name)) return needle.includes(name);
  return new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(needle);
};

export const resolveLocation = (value) => {
  const needle = normalize(value);
  if (!needle) return null;
  return LOCATIONS.find((item) => item.names.some((name) => matchesName(needle, name))) || null;
};
