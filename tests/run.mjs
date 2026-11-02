import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
const out = ".sites-runtime/test-build";
mkdirSync(out, { recursive: true });
writeFileSync(out + "/package.json", '{"type":"commonjs"}');
const t = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "lib/types.ts",
    "lib/seed.ts",
    "lib/demo-translations.ts",
    "lib/menu.ts",
    "lib/order.ts",
    "lib/tables.ts",
    "--resolveJsonModule",
    "lib/validation.ts",
    "lib/media-validation.ts",
    "--module",
    "commonjs",
    "--target",
    "es2022",
    "--skipLibCheck",
    "--esModuleInterop",
    "--outDir",
    out,
  ],
  { stdio: "inherit" },
);
if (t.status) process.exit(t.status);
const r = spawnSync(process.execPath, ["--test", "tests/menu.test.cjs"], {
  stdio: "inherit",
});
process.exit(r.status || 0);
