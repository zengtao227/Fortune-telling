module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
    jest: true,
  },
  globals: {
    __DEV__: "readonly",
  },
  ignorePatterns: ["node_modules/", "dist/", "release/", "android/", "ios/", ".expo/", ".eas/"],
  rules: {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
    "no-undef": "error",
  },
};
