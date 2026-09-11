import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The Chrome extension is plain browser JavaScript with the chrome.* API.
    files: ["extension/**/*.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.webextensions } },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  globalIgnores([".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts", "data/**"]),
]);

export default eslintConfig;
