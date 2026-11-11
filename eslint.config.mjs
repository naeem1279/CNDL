import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `_name` marks an intentionally unused binding (e.g. stripping a field
      // with object rest: `const { metadata: _metadata, ...safe } = user`).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Admin previews show arbitrary uploaded/remote URLs; keep as a nudge, not a gate.
      "@next/next/no-img-element": "warn",
    },
  },
  {
    // PM2 config and other Node tooling files must be CommonJS.
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "backups/**",
    "uploads/**",
    "releases/**",
  ]),
]);

export default eslintConfig;
