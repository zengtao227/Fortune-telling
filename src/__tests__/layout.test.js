import { StyleSheet } from "react-native";

import { getContentWidth, styles } from "../../App";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const flatten = (styleName) => StyleSheet.flatten(styles[styleName]);

describe("mobile layout width contract", () => {
  it("keeps the outer content gutter on the constrained container", () => {
    expect(flatten("cardContainer")).toMatchObject({
      maxWidth: 420,
      padding: 20,
    });
    expect(flatten("cardContainer").width).toBeUndefined();
  });

  it.each([
    [320, 320],
    [360, 360],
    [411, 411],
    [800, 420],
  ])("constrains a %ipx viewport to %ipx", (viewportWidth, expectedWidth) => {
    expect(getContentWidth(viewportWidth)).toBe(expectedWidth);
  });

  it.each([
    "almanacCard",
    "glassCard",
    "formContainer",
    "hexagramVisual",
    "hexagramPair",
    "movingLegend",
    "divider",
    "messageBlock",
    "resultLabel",
    "yiJiRow",
  ])("stretches %s inside its parent's content box", (styleName) => {
    const style = flatten(styleName);

    expect(style.alignSelf).toBe("stretch");
    expect(style.width).toBeUndefined();
  });

  it("stacks paired hexagrams instead of widening the screen", () => {
    expect(flatten("hexagramPair")).toMatchObject({
      flexDirection: "column",
      justifyContent: "center",
    });
    expect(flatten("hexagramPair").flexWrap).toBeUndefined();
  });
});
