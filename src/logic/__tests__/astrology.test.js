import { getBigThree, localDateTimeToUtc } from "../astrology";
import { parseDateParts, parseTimeParts, validateAstrologyInput } from "../inputValidation";

describe("strict input validation", () => {
  test.each(["2025-02-29", "2026-13-01", "2026-00-10", "not-a-date"])("rejects invalid date %s", (value) => {
    expect(parseDateParts(value)).toBeNull();
  });
  test("accepts leap day", () => expect(parseDateParts("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 }));
  test.each(["24:00", "12:60", "9:30"])("rejects invalid time %s", (value) => expect(parseTimeParts(value)).toBeNull());
  test("requires a supported location when time is provided", () => {
    expect(validateAstrologyInput({ date: "2000-01-01", time: "12:00", location: "" }).ok).toBe(false);
  });
});

describe("birthplace timezone conversion", () => {
  test("Zurich winter time converts to UTC+1", () => {
    expect(localDateTimeToUtc({ year: 2000, month: 1, day: 15, hour: 12, minute: 0 }, "Europe/Zurich").toISOString()).toBe("2000-01-15T11:00:00.000Z");
  });
  test("Zurich summer time converts to UTC+2", () => {
    expect(localDateTimeToUtc({ year: 2000, month: 7, day: 15, hour: 12, minute: 0 }, "Europe/Zurich").toISOString()).toBe("2000-07-15T10:00:00.000Z");
  });
  test("New York summer time converts to UTC-4", () => {
    expect(localDateTimeToUtc({ year: 2000, month: 7, day: 15, hour: 12, minute: 0 }, "America/New_York").toISOString()).toBe("2000-07-15T16:00:00.000Z");
  });
});

describe("getBigThree", () => {
  test("does not calculate moon or ascendant without time", () => {
    const result = getBigThree({ date: "2000-06-15", time: "", location: "" });
    expect(result.sun).toBeTruthy();
    expect(result.moon).toBeNull();
    expect(result.ascendant).toBeNull();
  });
  test("rejects unknown places instead of silently using Shanghai", () => {
    expect(() => getBigThree({ date: "2000-06-15", time: "12:00", location: "Atlantis" })).toThrow(/不支持/);
  });
  test("returns a resolved timezone for Basel", () => {
    const result = getBigThree({ date: "2000-06-15", time: "12:00", location: "Basel" });
    expect(result.location.timeZone).toBe("Europe/Zurich");
    expect(result.moon).toBeTruthy();
    expect(result.ascendant).toBeTruthy();
  });
});
