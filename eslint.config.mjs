import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["js/aos.min.js", "js/lucide.min.js"],
  },
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        AOS: "readonly"
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  }
];
