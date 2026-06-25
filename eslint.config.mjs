import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["js/*.min.js", "js/*.????????.js", "js/*.umd.js"],
  },
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        AOS: "readonly",
        EmblaCarousel: "readonly",
        EmblaCarouselAutoScroll: "readonly"
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
    }
  }
];
