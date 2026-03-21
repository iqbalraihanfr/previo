import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/page.tsx", "src/app/workspace/[id]/page.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/lib/db",
            "@/repositories/*",
            "@/services/*",
            "dexie-react-hooks",
            "@xyflow/react",
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*", "src/features/**/components/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/repositories/*", "@/services/*", "dexie-react-hooks"],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
