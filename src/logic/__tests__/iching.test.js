import {
  HEXAGRAM_CONFIG,
  findHexagramByLines,
  getHexagramLines,
} from "../iching";

describe("I Ching 六十四卦查找表", () => {
  const names = Object.keys(HEXAGRAM_CONFIG);

  test("共收录 64 个卦象", () => {
    expect(names).toHaveLength(64);
  });

  test("每个卦象都能通过 getHexagramLines/findHexagramByLines 正反互查", () => {
    names.forEach((name) => {
      const lines = getHexagramLines(name);
      expect(lines).toHaveLength(6);
      expect(findHexagramByLines(lines)).toBe(name);
    });
  });

  test("64 个卦象的六爻组合互不重复", () => {
    const patterns = names.map((name) => getHexagramLines(name).join(","));
    expect(new Set(patterns).size).toBe(64);
  });

  test("未知卦名返回 null", () => {
    expect(getHexagramLines("不存在的卦")).toBeNull();
  });

  test("无法匹配的爻组合返回 null", () => {
    expect(findHexagramByLines([1, 1, 1, 1, 1])).toBeNull();
  });
});
