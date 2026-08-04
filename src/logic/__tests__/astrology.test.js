import * as Astronomy from "astronomy-engine";

import { getBigThree, getSunSign } from "../astrology";

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
});
