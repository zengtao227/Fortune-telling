import * as Astronomy from "astronomy-engine";

import { getBigThree, getSunSign, localDateTimeToUtc } from "../astrology";

const ZODIAC_ORDER = [
  "白羊座",
  "金牛座",
  "双子座",
  "巨蟹座",
  "狮子座",
  "处女座",
  "天秤座",
  "天蝎座",
  "射手座",
  "摩羯座",
  "水瓶座",
  "双鱼座",
];

describe("getSunSign boundary correctness", () => {
  // 覆盖四季分点/至点前后的星座边界日期，直接用 astronomy-engine
  // 自己算出的黄道经度做交叉验证，而不是和一张简化日期表比对——
  // 这样才能真正测出"边界算错"这类回归。
  test.each([
    new Date(Date.UTC(2024, 0, 1)),
    new Date(Date.UTC(2024, 2, 21)),
    new Date(Date.UTC(2024, 3, 20)),
    new Date(Date.UTC(2024, 5, 21)),
    new Date(Date.UTC(2024, 8, 23)),
    new Date(Date.UTC(2024, 11, 22)),
    new Date(Date.UTC(2025, 6, 15)),
  ])("getSunSign(%s) matches astronomy-engine 自身计算出的黄道经度", (date) => {
    const astroDate = Astronomy.MakeTime(date);
    const longitude = Astronomy.SunPosition(astroDate).elon;
    const normalized = ((longitude % 360) + 360) % 360;
    const expectedIndex = Math.floor(normalized / 30);

    const result = getSunSign(date);
    expect(ZODIAC_ORDER.indexOf(result.name)).toBe(expectedIndex);
  });
});

describe("getBigThree 地点 fallback 标记", () => {
  test("提供了出生时间但地点未识别时，locationEstimated 为 true", () => {
    const result = getBigThree({
      date: "2000-06-15",
      time: "12:00",
      location: "Atlantis",
    });
    expect(result.locationEstimated).toBe(true);
  });

  test("地点命中城市库时，locationEstimated 为 false", () => {
    const result = getBigThree({
      date: "2000-06-15",
      time: "12:00",
      location: "北京市朝阳区",
    });
    expect(result.locationEstimated).toBe(false);
  });

  test("未提供出生时间时不计算上升星座，locationEstimated 也为 false", () => {
    const result = getBigThree({ date: "2000-06-15", location: "Atlantis" });
    expect(result.ascendant).toBeNull();
    expect(result.locationEstimated).toBe(false);
  });

  test("地点未识别时仍返回完整的日月升三合，而不是报错", () => {
    const result = getBigThree({
      date: "2000-06-15",
      time: "12:00",
      location: "Atlantis",
    });
    expect(result.sun).not.toBeNull();
    expect(result.moon).not.toBeNull();
    expect(result.ascendant).not.toBeNull();
    expect(result.timeEstimated).toBe(false);
  });
});

describe("localDateTimeToUtc 时区精确换算", () => {
  test("无夏令时时区(Asia/Shanghai)按固定 UTC+8 换算", () => {
    const result = localDateTimeToUtc(
      { year: 2000, month: 6, day: 15, hour: 12, minute: 0 },
      "Asia/Shanghai",
    );
    expect(result.toISOString()).toBe("2000-06-15T04:00:00.000Z");
  });

  test("落在美东夏令时切换缺口(2024-03-10 02:30 本地时间不存在)会抛出异常", () => {
    expect(() =>
      localDateTimeToUtc(
        { year: 2024, month: 3, day: 10, hour: 2, minute: 30 },
        "America/New_York",
      ),
    ).toThrow();
  });
});

describe("getBigThree 夏令时跳空场景的宽容处理", () => {
  test("出生时刻落在春季跳空缺口时不报错，顺延1小时并标记 timeEstimated", () => {
    const result = getBigThree({
      date: "2024-03-10",
      time: "02:30",
      location: "New York",
    });
    expect(result.timeEstimated).toBe(true);
    expect(result.locationEstimated).toBe(false);
    expect(result.ascendant).not.toBeNull();
  });

  test("正常时刻(无夏令时缺口)不标记 timeEstimated", () => {
    const result = getBigThree({
      date: "2024-03-10",
      time: "01:30",
      location: "New York",
    });
    expect(result.timeEstimated).toBe(false);
  });
});
