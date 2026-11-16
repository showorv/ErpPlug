// Shared ESLint config for the whole monorepo.
// Each package runs `eslint .`; ESLint finds this file by walking up from the package folder.
// Module boundary rules (R2-R4 from the BRD) are added by Uday in Phase 0.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

const reactAppFiles = [
  "apps/web/**/*.{ts,tsx}",
  "apps/admin/**/*.{ts,tsx}",
  "**/web/**/*.{ts,tsx}",
];
// packages/ui is a component library (shadcn files export variants next to components), so it
// gets the hooks rules but not the fast-refresh export rule.
const reactFiles = [...reactAppFiles, "packages/ui/**/*.{ts,tsx}"];

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/build/**", "**/coverage/**", "**/node_modules/**", "**/.turbo/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // React apps and every module's web/ folder: hooks rules + Vite fast-refresh safety.
  { files: reactFiles, ...reactHooks.configs.flat["recommended-latest"] },
  { files: reactAppFiles, ...reactRefresh.configs.vite },
  prettier,
);
