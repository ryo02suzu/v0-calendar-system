/**
 * Basic ESLint flat config so `pnpm lint` succeeds.
 * TypeScript files are linted via Next.js/TypeScript tooling, while ESLint
 * validates project-level JavaScript configs.
 */
export default [
  {
    ignores: ["node_modules", ".next", "dist", "out"],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}", "next.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
]
