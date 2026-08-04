module.exports = {
  root: true,
  extends: "universe/native",
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "release/",
    "android/",
    "ios/",
    ".expo/",
    ".eas/",
  ],
  env: { browser: true, node: true, es2021: true },
  globals: { localStorage: "readonly" },
};
