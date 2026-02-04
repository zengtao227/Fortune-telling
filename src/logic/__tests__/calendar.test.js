import { calculateAlmanac, getZodiac, performDivination } from "../calendar";

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
