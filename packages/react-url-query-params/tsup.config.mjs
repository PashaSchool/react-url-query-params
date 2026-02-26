import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: {
    index: "src/index.ts",
    "next/index": "src/next/index.ts",
    "next-pages/index": "src/next-pages/index.ts",
  },
  external: ["next", "react", "react-dom", "react-router-dom"],
  format: ["esm", "cjs"],
  sourcemap: false,
  target: "es2020",
});
