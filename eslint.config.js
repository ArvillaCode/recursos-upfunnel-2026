import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["assets/**/*.js", "sw.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "prefer-const": "error"
    },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.js", "playwright.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "prefer-const": "error"
    },
  },
];
