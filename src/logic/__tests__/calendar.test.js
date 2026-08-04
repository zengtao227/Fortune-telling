import { Solar } from "lunar-javascript";

import { calculateAlmanac, getZodiac, performDivination } from "../calendar";

const ALMANAC_FIELDS = [
  "solar", "lunar", "shen", "tianShen", "tianShenType", "yi", "ji",
  "yiArray", "jiArray", "jiShi", "chongSha", "jiShen", "xiongSha",
  "xiu", "zheng", "taiShen", "pengZu", "jieQi", "jiuXing",
];

describe("Calendar Logic", () => {
  test("calculateAlmanac returns correct structure", () => {
    const testDate = new Date(2025, 1, 3); // 2025-02-03
    const result = calculateAlmanac(testDate);

    expect(result).toHaveProperty("solar");
    expect(result).toHaveProperty("lunar");
    expect(result).toHaveProperty("yi");
    expect(result).toHaveProperty("ji");
    expect(result.solar).toContain("2025年2月3日");
  });

  test("calculateAlmanac 字段契约：19个字段必须全部保留，防止 lunar-javascript 升级时静默丢字段", () => {
    const result = calculateAlmanac(new Date(2025, 1, 3));
    ALMANAC_FIELDS.forEach((field) => {
      expect(result).toHaveProperty(field);
    });
    expect(Object.keys(result).sort()).toEqual(ALMANAC_FIELDS.sort());
  });

  test("jiShi 只包含天神吉凶为'吉'的时辰，与 lunar-javascript 直接计算的结果一致", () => {
    const testDate = new Date(2024, 5, 15);
    const result = calculateAlmanac(testDate);

    const lunar = Solar.fromDate(testDate).getLunar();
    const expectedZhi = (lunar.getTimes() || [])
      .filter((item) => typeof item.getTianShenLuck === "function" && item.getTianShenLuck() === "吉")
      .map((item) => item.getZhi());

    if (expectedZhi.length === 0) {
      expect(result.jiShi).toBe("吉时待查");
    } else {
      expectedZhi.forEach((zhi) => {
        expect(result.jiShi).toContain(`${zhi}时`);
      });
      // 行数应与吉时数量一致，不多不少
      expect(result.jiShi.split("\n")).toHaveLength(expectedZhi.length);
    }
  });

  test("getZodiac returns correct sign for a given date", () => {
    const testDate = new Date(2025, 0, 20); // 1月20日 摩羯/水瓶交界
    const result = getZodiac(testDate);

    expect(result.name).toBe("水瓶座");
    expect(result.en).toBe("Aquarius");
  });

  test("performDivination returns 6 lines", () => {
    const result = performDivination();
    expect(result.lines).toHaveLength(6);
    expect(result.raw).toHaveLength(6);
  });
});
