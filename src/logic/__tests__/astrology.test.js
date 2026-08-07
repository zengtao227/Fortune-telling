import * as Astronomy from "astronomy-engine";

import { getBigThree, getSunSign, localDateTimeToUtc } from "../astrology";
import { resolveLocation } from "../locations";

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
    expect(result.type).toBe("unique");
    expect(result.utc.toISOString()).toBe("2000-06-15T04:00:00.000Z");
  });

  test("落在美东春季跳空缺口(2024-03-10 02:30 本地时间不存在)，顺延到切换后的有效瞬间", () => {
    const result = localDateTimeToUtc(
      { year: 2024, month: 3, day: 10, hour: 2, minute: 30 },
      "America/New_York",
    );
    expect(result.type).toBe("gap");
    // 02:30 EST 不存在；切换幅度是1小时，顺延后对应 03:30 EDT = 07:30 UTC
    expect(result.utc.toISOString()).toBe("2024-03-10T07:30:00.000Z");
  });

  test("苏黎世秋季回拨(2024-10-27 02:30 出现两次)，取较早的一次并标记歧义", () => {
    const result = localDateTimeToUtc(
      { year: 2024, month: 10, day: 27, hour: 2, minute: 30 },
      "Europe/Zurich",
    );
    expect(result.type).toBe("ambiguous");
    // 两个合法候选是 00:30Z(CEST，第一次) 和 01:30Z(CET，第二次)，取较早
    expect(result.utc.toISOString()).toBe("2024-10-27T00:30:00.000Z");
  });

  test("美东秋季回拨(2024-11-03 01:30 出现两次)，取较早的一次并标记歧义", () => {
    const result = localDateTimeToUtc(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      "America/New_York",
    );
    expect(result.type).toBe("ambiguous");
    expect(result.utc.toISOString()).toBe("2024-11-03T05:30:00.000Z");
  });
});

describe("getBigThree 夏令时边界场景的宽容处理", () => {
  test("出生时刻落在春季跳空缺口时不报错，顺延后标记 timeEstimated", () => {
    const result = getBigThree({
      date: "2024-03-10",
      time: "02:30",
      location: "New York",
    });
    expect(result.timeEstimated).toBe(true);
    expect(result.timeAmbiguous).toBe(false);
    expect(result.locationEstimated).toBe(false);
    expect(result.ascendant).not.toBeNull();
  });

  test("出生时刻落在秋季回拨歧义窗口时不报错，标记 timeAmbiguous", () => {
    const result = getBigThree({
      date: "2024-11-03",
      time: "01:30",
      location: "New York",
    });
    expect(result.timeAmbiguous).toBe(true);
    expect(result.timeEstimated).toBe(false);
    expect(result.ascendant).not.toBeNull();
  });

  test("正常时刻(无夏令时边界问题)两个标记都为 false", () => {
    const result = getBigThree({
      date: "2024-03-10",
      time: "01:30",
      location: "New York",
    });
    expect(result.timeEstimated).toBe(false);
    expect(result.timeAmbiguous).toBe(false);
  });
});

describe("resolveLocation 子串误匹配修复", () => {
  test("Xianyang(咸阳/其他)不应误配成 Xian(西安)", () => {
    expect(resolveLocation("Xianyang")).toBeNull();
  });

  test("北京市朝阳区(CJK地址后缀)仍能命中北京", () => {
    expect(resolveLocation("北京市朝阳区")?.id).toBe("beijing");
  });

  test("Shanghai, China(App占位符范式)仍能命中上海", () => {
    expect(resolveLocation("Shanghai, China")?.id).toBe("shanghai");
  });

  test("完全无关的地名返回 null", () => {
    expect(resolveLocation("Atlantis")).toBeNull();
  });
});

describe("getBigThree locationProvided 区分未填写与未识别", () => {
  test("地点留空时 locationProvided 为 false", () => {
    const result = getBigThree({ date: "2000-06-15", time: "12:00", location: "" });
    expect(result.locationEstimated).toBe(true);
    expect(result.locationProvided).toBe(false);
  });

  test("地点填了但未识别时 locationProvided 为 true", () => {
    const result = getBigThree({ date: "2000-06-15", time: "12:00", location: "Atlantis" });
    expect(result.locationEstimated).toBe(true);
    expect(result.locationProvided).toBe(true);
  });
});
