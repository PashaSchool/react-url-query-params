import { writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";
import { defineConfig } from "tsup";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function generateWorkerCode() {
  const result = await esbuild.build({
    bundle: true,
    entryPoints: [resolve(__dirname, "src/core/worker.ts")],
    format: "iife",
    platform: "browser",
    target: "es2020",
    write: false,
  });

  const code = result.outputFiles[0].text;

  writeFileSync(
    resolve(__dirname, "src/core/workerCode.ts"),
    `// Auto-generated from src/core/worker.ts — do not edit manually\nexport const workerCode = ${JSON.stringify(code)};\n`,
  );
}

await generateWorkerCode();

export default defineConfig({
  entry: ["src/index.ts"],
  esbuildOptions(options) {
    options.platform = "browser";
  },
  external: ["react"],
  format: ["esm", "cjs"],
  sourcemap: false,
  target: "es2020",
});
